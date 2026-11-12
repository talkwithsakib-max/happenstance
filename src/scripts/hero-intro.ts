// Hero intro: the prompt types a question, "submits" it, thinks for a beat, and the answer card
// comes out from under the input with its warm paths. Two follow-up questions then build on it,
// chat-style: each is typed in the input, and on submit the previous answer slides away under the
// input, the question lands in the box as a bubble, and its answer appears below at the same
// height. The demo loops while the hero is on screen. Everything runs on the Web Animations API, so the whole sequence
// shares one clock (it pauses together when the tab is hidden) and needs no dependency.
//
// The page is server-rendered in its finished Figma state. An inline script in Hero.astro sets
// data-intro="pending" before first paint (only when motion is allowed); CSS then hides the
// `.intro-hide` pieces until this sequence adds `.is-in` to each one.

import { thinkKeyframes, THINK_IN, THINK_OUT } from './motion';

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';

export function initHeroIntro(hero: HTMLElement) {
  if (hero.dataset.intro !== 'pending') return;

  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => hero.querySelector<T>(sel)!;
  const $$ = (sel: string) => [...hero.querySelectorAll<HTMLElement>(sel)];

  const prompt = $('[data-prompt]');
  const typed = $('[data-typed]');
  const progress = $('.prompt-progress');
  const bot = hero.querySelector<HTMLElement>('[data-thinking]');
  const send = $<HTMLButtonElement>('[data-prompt] button');
  const queries: string[] = JSON.parse(typed.dataset.queries || '[]');
  const answer = $('[data-answer]');
  const cta = $('[data-cta]');
  const results = $$('[data-result]').map((el) => ({
    el,
    bubble: el.querySelector<HTMLElement>('[data-bubble]'),
    count: el.querySelector<HTMLElement>('[data-count-to]'),
    // Everything that appears after the bubble, in reading order.
    items: [...el.querySelectorAll<HTMLElement>('.intro-hide:not([data-bubble])')],
  }));

  let run = 0; // bumped on every restart, so a replaced run stops at its next step
  let visible = true;
  let owned: Animation[] = [];

  // Waits ride the document timeline too, so typing never runs ahead of the visuals.
  const wait = (ms: number) => hero.animate([], { duration: ms }).finished;

  const play = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions, keep = false) => {
    const anim = el.animate(keyframes, { fill: 'both', easing: EASE_OUT, ...options });
    owned.push(anim);
    // Hand the final state back to CSS once done, so hover styles and idle loops resume.
    if (!keep) anim.finished.then(() => anim.cancel(), () => {});
    return anim;
  };

  const reveal = (el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions, keep = false) => {
    el.classList.add('is-in');
    return play(el, keyframes, options, keep);
  };

  // Human-feeling rhythm: a steady base with small, repeatable variation and pauses at word ends.
  const typingDelay = (char: string, i: number) => {
    const jitter = ((i * 7919) % 37) - 12;
    if (char === ' ') return 58 + (i % 3) * 22;
    if (char === '?') return 140;
    return 36 + jitter;
  };

  const countUp = (el: HTMLElement, to: number, duration: number) =>
    new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(to * eased).toLocaleString('en-US');
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

  const showResult = (index: number) => results.forEach((r, i) => r.el.classList.toggle('is-current', i === index));

  const reset = () => {
    owned.forEach((a) => a.cancel());
    owned = [];
    $$('.intro-hide').forEach((el) => el.classList.remove('is-in'));
    prompt.classList.remove('is-typing', 'is-searching');
    typed.textContent = '';
    results.forEach((r) => r.count && (r.count.textContent = '0'));
    showResult(0);
  };

  const typeQuestion = async (question: string) => {
    prompt.classList.add('is-typing');
    await wait(450);
    for (let i = 0; i < question.length; i++) {
      typed.textContent += question[i];
      await wait(typingDelay(question[i], i));
    }
    prompt.classList.remove('is-typing');
    await wait(340);
  };

  // "Submit": the button presses and a thin sweep shows the search running.
  const pressSend = () => {
    play(send, [{ transform: 'scale(1)' }, { transform: 'scale(0.9)', offset: 0.35 }, { transform: 'scale(1)' }], {
      duration: 340,
      easing: EASE_IN_OUT,
      fill: 'none',
    });
    prompt.classList.add('is-searching');
    play(
      progress,
      [
        { opacity: 0, backgroundPosition: '-60% 0' },
        { opacity: 1, offset: 0.15 },
        { opacity: 1, offset: 0.8 },
        { opacity: 0, backgroundPosition: '160% 0' },
      ],
      { duration: 1100, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'none' },
    );
  };

  // The answer's pieces one after another; the strongest path takes its highlight last.
  const showItems = async (r: (typeof results)[number]) => {
    if (r.count) countUp(r.count, Number(r.count.dataset.countTo), 1000);
    r.items.forEach((item, i) =>
      reveal(
        item,
        i === 0 && !r.bubble
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' },
              { opacity: 1, transform: 'none', filter: 'blur(0px)' },
            ],
        { duration: 620, delay: i * 130 },
      ),
    );
    const active = r.el.querySelector<HTMLElement>('.path.active, .mini.match');
    if (active) {
      const styles = getComputedStyle(active);
      play(
        active,
        [
          { borderColor: 'rgba(29, 92, 230, 0)', boxShadow: '0 8px 24px -10px rgba(29, 92, 230, 0)' },
          { borderColor: styles.borderColor, boxShadow: styles.boxShadow },
        ],
        { duration: 700, delay: r.items.length * 130 + 300 },
      );
    }
    await wait(r.items.length * 130 + 1000);
  };

  // The previous answer slides up and away under the input (the prompt sits above the card).
  const slideAway = async (r: (typeof results)[number]) => {
    const out = play(
      r.el,
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(-64px)' },
      ],
      { duration: 480, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' },
      true,
    );
    await wait(480);
    r.el.querySelectorAll('.intro-hide').forEach((el) => el.classList.remove('is-in'));
    out.cancel();
  };

  const whenVisible = async () => {
    while (!visible || document.hidden) await new Promise((resolve) => setTimeout(resolve, 400));
  };

  const runSequence = async () => {
    const mine = ++run;
    const stale = () => mine !== run;
    reset();
    hero.dataset.intro = 'playing';

    for (let first = true; ; first = false) {
      for (let n = 0; n < results.length; n++) {
        const r = results[n];
        const previous = results[(n - 1 + results.length) % results.length];

        await typeQuestion(queries[n] ?? '');
        if (stale()) return;
        pressSend();

        if (first && n === 0) {
          // A quick "Thinking" beat below the prompt, then the card slides out from under the input.
          const THINK_HOLD = 520;
          const THINK_DELAY = 120;
          if (bot) {
            play(bot, thinkKeyframes(THINK_HOLD), {
              duration: THINK_IN + THINK_HOLD + THINK_OUT,
              delay: THINK_DELAY,
              easing: 'linear',
              fill: 'none',
            });
          }
          await wait(THINK_DELAY + THINK_IN + THINK_HOLD + THINK_OUT);
          if (stale()) return;
          reveal(
            answer,
            [
              { opacity: 0, transform: 'translateY(-36px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 760 },
          );
          await wait(280);
        } else {
          // Chat-style: the old answer goes up under the input, and a follow-up leaves the input to
          // become a bubble in the box. (The first question, on a loop, stays in the input.)
          if (r.bubble) play(typed, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'none' });
          await slideAway(previous);
          if (stale()) return;
          if (r.count) r.count.textContent = '0';
          showResult(n);
          if (r.bubble) {
            typed.textContent = '';
            reveal(
              r.bubble,
              [
                { opacity: 0, transform: 'translateY(-22px) scale(0.96)' },
                { opacity: 1, transform: 'none' },
              ],
              { duration: 460 },
            );
          }
          await wait(680);
        }
        if (stale()) return;

        await showItems(r);
        prompt.classList.remove('is-searching');
        if (first && n === 0) {
          // The buttons come in once the first answer has settled. The frosted strip fades in on its
          // own (an opacity or filter on its parent would switch the backdrop blur off until the end
          // and make it pop in), then each button rises out of a soft blur.
          const frost = cta.querySelector<HTMLElement>('.frost');
          if (frost) play(frost, [{ opacity: 0 }, { opacity: 1 }], { duration: 1000, easing: 'ease-in-out' });
          cta.querySelectorAll<HTMLElement>('.btn').forEach((btn, i) =>
            play(
              btn,
              [
                { opacity: 0, transform: 'translateY(10px)', filter: 'blur(8px)' },
                { opacity: 1, transform: 'none', filter: 'blur(0px)' },
              ],
              { duration: 800, delay: 260 + i * 110 },
            ),
          );
          cta.classList.add('is-in');
          await wait(1200);
        }
        if (stale()) return;

        // Time to read the answer before the next question; the demo waits while it is off screen.
        await wait(n === results.length - 1 ? 4600 : 2800);
        await whenVisible();
        if (stale()) return;
        // Clear the input for the next question (a follow-up already left it for its bubble).
        if (typed.textContent) {
          await play(typed, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'none' }).finished.catch(() => {});
          typed.textContent = '';
        }
      }
    }
  };

  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(prompt);

  send.addEventListener('click', runSequence);

  const start = () => runSequence();
  if (document.fonts?.status === 'loaded') wait(300).then(start);
  else document.fonts.ready.then(() => wait(300)).then(start);
}
