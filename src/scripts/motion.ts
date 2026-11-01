// Small helpers for in-card motion sequences (job seekers, AI tools).
// Same approach as the hero intro: Web Animations API only, so every step shares the document
// timeline and pauses with the tab.
//
// Markup contract:
// - A sequence root carries data-motion. An inline script sets it to "pending" before paint when
//   motion is allowed; global CSS then hides its `.m-hide` children until they get `.is-in`.
// - Elements with data-type hold text that is typed out; data-stream text appears word by word.

export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
export const EASE_SETTLE = 'cubic-bezier(0.34, 1.32, 0.64, 1)';

export const rise: Keyframe[] = [
  { opacity: 0, transform: 'translateY(10px)', filter: 'blur(4px)' },
  { opacity: 1, transform: 'none', filter: 'blur(0px)' },
];
export const fadeUp: Keyframe[] = [
  { opacity: 0, transform: 'translateY(6px)' },
  { opacity: 1, transform: 'none' },
];
export const pop: Keyframe[] = [
  { opacity: 0, transform: 'scale(0.9)' },
  { opacity: 1, transform: 'none' },
];

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// "Thinking" bot (ThinkingBot.astro): pops in like x.ai's pending row, holds, then fades out.
export const THINK_IN = 280;
export const THINK_OUT = 220;
export const thinkKeyframes = (hold: number): Keyframe[] => {
  const total = THINK_IN + hold + THINK_OUT;
  return [
    { offset: 0, opacity: 0, transform: 'translateY(8px) scale(0.97)', easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.15)' },
    { offset: THINK_IN / total, opacity: 1, transform: 'none' },
    { offset: (THINK_IN + hold) / total, opacity: 1, transform: 'none', easing: 'ease-in' },
    { offset: 1, opacity: 0, transform: 'translateY(-4px)' },
  ];
};

export function createSequence(root: HTMLElement) {
  let owned: Animation[] = [];
  let token = 0;

  const track = (anim: Animation, keep = false) => {
    owned.push(anim);
    // Hand the final state back to CSS so hover styles and idle loops resume.
    if (!keep) anim.finished.then(() => anim.cancel(), () => {});
    return anim;
  };

  const play = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions, keep = false) =>
    track(el.animate(keyframes, { fill: 'both', easing: EASE_OUT, ...options }), keep);

  const reveal = (el: Element | null, keyframes: Keyframe[], options: KeyframeAnimationOptions, keep = false) => {
    if (!el) return null;
    el.classList.add('is-in');
    return play(el, keyframes, options, keep);
  };

  /** Resolves after `ms` on the document timeline; rejects if the sequence was restarted. */
  const wait = async (ms: number) => {
    const mine = token;
    const anim = root.animate([], { duration: ms });
    owned.push(anim);
    await anim.finished;
    if (mine !== token) throw new Error('stale');
  };

  const typeText = async (el: HTMLElement, text: string, pace = 34) => {
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      const jitter = ((i * 7919) % 31) - 10;
      await wait(text[i] === ' ' ? pace + 26 : pace + jitter);
    }
  };

  /** Splits text into word spans once, then reveals them in order. */
  const stream = (el: HTMLElement, { stagger = 26, delay = 0 } = {}) => {
    if (!el.dataset.streamReady) {
      const words = (el.textContent ?? '').trim().split(/(\s+)/);
      el.textContent = '';
      for (const w of words) {
        if (/^\s+$/.test(w)) el.append(w);
        else {
          const span = document.createElement('span');
          span.className = 'm-word';
          span.textContent = w;
          el.append(span);
        }
      }
      el.dataset.streamReady = 'true';
    }
    el.classList.add('is-in');
    const words = [...el.querySelectorAll<HTMLElement>('.m-word')];
    words.forEach((w, i) =>
      play(w, [{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0px)' }], {
        duration: 420,
        delay: delay + i * stagger,
      }),
    );
    return delay + words.length * stagger + 420;
  };

  /** Shows a ThinkingBot for `hold` ms starting at `delay`; returns when the reply should begin. */
  const think = (el: Element | null, delay: number, hold = 900) => {
    if (!el) return delay;
    play(el, thinkKeyframes(hold), { duration: THINK_IN + hold + THINK_OUT, delay, fill: 'none', easing: 'linear' });
    return delay + THINK_IN + hold;
  };

  /** Resolves once every step started so far has finished (or was cancelled by a restart). */
  const settled = () => Promise.allSettled(owned.map((a) => a.finished)).then(() => undefined);

  /** Clears every running step and hides the sequence's pieces again. */
  const reset = () => {
    token++;
    owned.forEach((a) => a.cancel());
    owned = [];
    root.querySelectorAll('.m-hide, [data-stream]').forEach((el) => el.classList.remove('is-in'));
    root.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => (el.textContent = ''));
  };

  /** Shows the finished state immediately (used when motion is reduced or a run is skipped). */
  const finish = () => {
    token++;
    owned.forEach((a) => a.cancel());
    owned = [];
    root.querySelectorAll('.m-hide, [data-stream]').forEach((el) => el.classList.add('is-in'));
    root.querySelectorAll<HTMLElement>('[data-type]').forEach((el) => (el.textContent = el.dataset.type ?? ''));
  };

  return { play, reveal, wait, typeText, stream, think, settled, reset, finish };
}

/** Runs `start` the first time `el` is well inside the viewport. */
export function onFirstView(el: Element, start: () => void, threshold = 0.35) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    },
    { threshold },
  );
  io.observe(el);
}
