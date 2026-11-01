// Hero intro: the prompt types a question, "submits" it, thinks for a beat, and the answer card
// comes out from under the input with its warm paths. Everything runs on the Web Animations API, so the whole sequence
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
  const question = typed.textContent!.trim();

  const parts = {
    answer: $('[data-answer]'),
    head: $('.answer-head'),
    count: $('[data-count-to]'),
    paths: $$('.path'),
  };

  let running = false;
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

  const reset = () => {
    owned.forEach((a) => a.cancel());
    owned = [];
    $$('.intro-hide').forEach((el) => el.classList.remove('is-in'));
    prompt.classList.remove('is-typing', 'is-searching');
    typed.textContent = '';
    parts.count.textContent = '0';
  };

  const runSequence = async () => {
    if (running) return;
    running = true;
    reset();
    hero.dataset.intro = 'playing';

    // 1. Type the question.
    prompt.classList.add('is-typing');
    await wait(450);
    for (let i = 0; i < question.length; i++) {
      typed.textContent += question[i];
      await wait(typingDelay(question[i], i));
    }
    prompt.classList.remove('is-typing');
    await wait(340);

    // 2. Submit: the button presses and a thin sweep shows the search running.
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
    // A quick "Thinking" beat below the prompt; nothing else appears until it has gone.
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

    // 3. The answer slides out from under the input (the prompt sits above it) and fades in.
    reveal(
      parts.answer,
      [
        { opacity: 0, transform: 'translateY(-36px)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 760 },
    );
    await wait(280);

    // 4. The label and the mapped count, then the warm paths one after another.
    reveal(parts.head, [{ opacity: 0 }, { opacity: 1 }], { duration: 480 });
    countUp(parts.count, Number(parts.count.dataset.countTo), 1000);
    parts.paths.forEach((row, i) =>
      reveal(
        row,
        [
          { opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' },
          { opacity: 1, transform: 'none', filter: 'blur(0px)' },
        ],
        { duration: 620, delay: 120 + i * 130 },
      ),
    );

    // 5. The strongest path takes its highlight last.
    const active = parts.paths.find((row) => row.classList.contains('active'));
    if (active) {
      const styles = getComputedStyle(active);
      play(
        active,
        [
          { borderColor: 'rgba(29, 92, 230, 0)', boxShadow: '0 8px 24px -10px rgba(29, 92, 230, 0)' },
          { borderColor: styles.borderColor, boxShadow: styles.boxShadow },
        ],
        { duration: 700, delay: 120 + parts.paths.length * 130 + 300 },
      );
    }
    await wait(120 + parts.paths.length * 130 + 1000);

    prompt.classList.remove('is-searching');
    running = false;
  };

  send.addEventListener('click', runSequence);

  const start = () => runSequence();
  if (document.fonts?.status === 'loaded') wait(300).then(start);
  else document.fonts.ready.then(() => wait(300)).then(start);
}
