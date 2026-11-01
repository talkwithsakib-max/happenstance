// Hero intro: the prompt types a question, "submits" it, and the network panel builds its
// answer step by step. Everything runs on the Web Animations API, so the whole sequence
// shares one clock (it pauses together when the tab is hidden) and needs no dependency.
//
// The page is server-rendered in its finished Figma state. An inline script in Hero.astro sets
// data-intro="pending" before first paint (only when motion is allowed); CSS then hides the
// `.intro-hide` pieces until this sequence adds `.is-in` to each one.

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const EASE_SETTLE = 'cubic-bezier(0.34, 1.32, 0.64, 1)'; // a whisper of overshoot, no bounce

const fadeUp: Keyframe[] = [
  { opacity: 0, transform: 'translateY(6px)' },
  { opacity: 1, transform: 'none' },
];

export function initHeroIntro(hero: HTMLElement) {
  if (hero.dataset.intro !== 'pending') return;

  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => hero.querySelector<T>(sel)!;
  const $$ = (sel: string) => [...hero.querySelectorAll<HTMLElement>(sel)];

  const prompt = $('[data-prompt]');
  const typed = $('[data-typed]');
  const progress = $('.prompt-progress');
  const send = $<HTMLButtonElement>('[data-prompt] button');
  const question = typed.textContent!.trim();

  const parts = {
    stage: $('[data-stage]'),
    labelSources: $('.label-sources'),
    labelMap: $('.label-map'),
    labelPaths: $('.label-paths'),
    sources: $$('.source'),
    wipe: $('[data-wipe]'),
    pulses: $('[data-pulses]'),
    contactShadow: $('.contact-shadow'),
    you: $('.you'),
    halo: $('.halo'),
    caption: $('.you-caption'),
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
    // The empty result panel stays hidden while typing and fades in softly once submitted.
    reveal(parts.stage, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
      duration: 900,
    });
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
    await wait(440);

    // 3. Connected accounts arrive one after another.
    reveal(parts.labelSources, fadeUp, { duration: 500 });
    parts.sources.forEach((el, i) =>
      reveal(
        el,
        [
          { opacity: 0, transform: 'translateX(-10px)', filter: 'blur(4px)' },
          { opacity: 1, transform: 'none', filter: 'blur(0px)' },
        ],
        { duration: 620, delay: 90 + i * 85 },
      ),
    );
    await wait(90 + 4 * 85 + 260);

    // 4. Lines draw toward "You" (the connector art spans the panel; reveal it left to right).
    const wipeIn = reveal(
      parts.wipe,
      [{ clipPath: 'inset(0 75% 0 0)' }, { clipPath: 'inset(0 62.7% 0 0)' }],
      { duration: 520, easing: EASE_IN_OUT },
      true,
    );
    await wait(380);

    // 5. "You" settles in and the mapped count rises.
    reveal(parts.labelMap, fadeUp, { duration: 500 });
    reveal(parts.contactShadow, [{ opacity: 0, transform: 'scaleX(0.6)' }, { opacity: 1, transform: 'none' }], {
      duration: 700,
    });
    reveal(parts.you, [{ opacity: 0, transform: 'scale(0.86)' }, { opacity: 1, transform: 'none' }], {
      duration: 760,
      easing: EASE_SETTLE,
    });
    play(parts.halo, [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }], {
      duration: 1100,
      delay: 120,
    });
    reveal(parts.caption, fadeUp, { duration: 520, delay: 260 });
    await wait(260);
    countUp(parts.count, Number(parts.count.dataset.countTo), 1100);
    await wait(520);

    // 6. Lines continue to the right and the warm paths rise in, strongest first.
    const wipeOut = play(
      parts.wipe,
      [{ clipPath: 'inset(0 62.7% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }],
      { duration: 760, easing: EASE_IN_OUT },
      true,
    );
    wipeOut.finished.then(() => {
      wipeIn.cancel();
      wipeOut.cancel();
    }, () => {});
    reveal(parts.pulses, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 640 });
    await wait(300);

    reveal(parts.labelPaths, fadeUp, { duration: 500 });
    parts.paths.forEach((card, i) => {
      const delay = 120 + i * 150;
      const shadow = 'drop-shadow(0 2px 2px rgba(36, 55, 85, 0.07))';
      reveal(
        card,
        [
          { opacity: 0, transform: 'translateY(12px) scale(0.985)', filter: `blur(4px) ${shadow}` },
          { opacity: 1, transform: 'none', filter: `blur(0px) ${shadow}` },
        ],
        { duration: 680, delay },
      );
      card.querySelectorAll('.bars i').forEach((bar, j) =>
        play(
          bar,
          [
            { transform: 'scaleY(0)', transformOrigin: '50% 100%' },
            { transform: 'scaleY(1)', transformOrigin: '50% 100%' },
          ],
          { duration: 460, delay: delay + 380 + j * 70 },
        ),
      );
      if (card.classList.contains('active')) {
        const styles = getComputedStyle(card);
        play(
          card,
          [
            { borderColor: 'rgba(29, 92, 230, 0)', boxShadow: '0 8px 24px -10px rgba(29, 92, 230, 0)' },
            { borderColor: styles.borderColor, boxShadow: styles.boxShadow },
          ],
          { duration: 700, delay: 120 + parts.paths.length * 150 + 420 },
        );
      }
    });
    await wait(120 + parts.paths.length * 150 + 1120);

    prompt.classList.remove('is-searching');
    running = false;
  };

  send.addEventListener('click', runSequence);

  const start = () => runSequence();
  if (document.fonts?.status === 'loaded') wait(300).then(start);
  else document.fonts.ready.then(() => wait(300)).then(start);
}
