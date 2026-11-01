// Network step 1 ("Connect your accounts"), markup in NetworkConnect.astro.
// Every account sends a colored signal along its line into "You", one line drops to the source
// stack, then the stack cycles card by card (Paraform style): each cycle, the next source's
// account fires, the signal runs down to the stack and that card comes to the front.

import { createSequence } from './motion';

const TRAVEL = 'cubic-bezier(0.45, 0, 0.55, 1)';
const YOU_REST =
  'inset -3px -3px 4px rgba(191, 229, 251, 0.4), inset 4px 4px 4px rgba(19, 26, 228, 0.1), 0 0 0 0 rgba(30, 130, 224, 0)';
const YOU_LIT =
  'inset -3px -3px 4px rgba(191, 229, 251, 0.4), inset 4px 4px 4px rgba(19, 26, 228, 0.1), 0 0 0 6px rgba(30, 130, 224, 0.16)';

export function initConnect(root: HTMLElement) {
  const signals = [...root.querySelectorAll<SVGPathElement>('[data-signal]')];
  const drop = root.querySelector<SVGPathElement>('[data-drop]')!;
  const tiles = [...root.querySelectorAll<HTMLElement>('[data-account]')];
  const you = root.querySelector<HTMLElement>('[data-you]')!;
  const stack = root.querySelector<HTMLElement>('[data-stack]')!;
  const cards = [...stack.querySelectorAll<HTMLElement>('.cx-card')];
  const seq = createSequence(root);
  const { play, wait } = seq;

  let running = false;
  let rolls: number[] = [];

  const bySlot = (slot: string) => cards.find((c) => c.dataset.slot === slot)!;
  const format = (n: number) => n.toLocaleString('en-US');

  /** A short colored dash travels the whole line, from its source to its end. */
  const pulse = (path: SVGPathElement, delay: number, duration: number) =>
    play(
      path,
      [
        { opacity: 0, strokeDashoffset: 34 },
        { opacity: 1, offset: 0.1 },
        { opacity: 1, offset: 0.88 },
        { opacity: 0, strokeDashoffset: -100 },
      ],
      { duration, delay, easing: TRAVEL, fill: 'none' },
    );

  const press = (tile: HTMLElement, delay: number) =>
    play(tile, [{ transform: 'none' }, { transform: 'scale(0.92)', offset: 0.4 }, { transform: 'none' }], {
      duration: 360,
      delay,
      fill: 'none',
    });

  const receive = (delay: number) =>
    play(
      you,
      [
        { transform: 'none', boxShadow: YOU_REST },
        { transform: 'scale(1.05)', boxShadow: YOU_LIT, offset: 0.35 },
        { transform: 'none', boxShadow: YOU_REST },
      ],
      { duration: 620, delay, fill: 'none' },
    );

  /** The front card's badge pops and its count rolls up by the badge amount. */
  const land = (card: HTMLElement, delay: number) => {
    play(
      card.querySelector('[data-pop]')!,
      [
        { opacity: 0, transform: 'scale(0.6)' },
        { opacity: 1, transform: 'scale(1.12)', offset: 0.6 },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 440, delay },
    );
    const el = card.querySelector<HTMLElement>('[data-count]')!;
    const to = Number(card.dataset.people);
    const from = to - Number(card.dataset.badge);
    el.textContent = format(from);
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / 700));
      el.textContent = format(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) rolls.push(requestAnimationFrame(tick));
    };
    rolls.push(requestAnimationFrame(tick));
  };

  /** Front card lifts away, every other card moves up a slot, and it rejoins at the back. */
  const cycle = async () => {
    const front = bySlot('0');
    front.dataset.slot = 'out';
    cards.forEach((c) => {
      if (c !== front) c.dataset.slot = String(Number(c.dataset.slot) - 1);
    });
    await wait(380);
    front.dataset.slot = String(cards.length - 1);
  };

  const restore = () => {
    rolls.forEach(cancelAnimationFrame);
    rolls = [];
    stack.classList.add('cx-instant');
    cards.forEach((card, i) => {
      card.dataset.slot = String(i);
      card.querySelector<HTMLElement>('[data-count]')!.textContent = format(Number(card.dataset.people));
    });
    void stack.offsetWidth;
    stack.classList.remove('cx-instant');
  };

  const run = async () => {
    // 1. Every account fires, top first, and the signals converge on "You".
    [2, 1, 3, 0, 4].forEach((i, n) => {
      press(tiles[i], n * 110);
      pulse(signals[i], n * 110 + 60, 760);
    });
    receive(1080);
    await wait(1140);

    // 2. One line carries it down to the source stack.
    pulse(drop, 0, 560);
    await wait(470);
    land(bySlot('0'), 0);
    await wait(1000);

    // 3. Paraform-style cycling: the next source fires, its card comes forward.
    for (;;) {
      const next = bySlot('1');
      const line = Number(next.dataset.line);
      press(tiles[line], 0);
      pulse(signals[line], 40, 560);
      receive(520);
      pulse(drop, 560, 460);
      await wait(940);
      cycle().catch(() => {});
      land(next, 220);
      await wait(1200);
    }
  };

  return {
    toggle(on: boolean) {
      if (on === running) return;
      running = on;
      seq.reset();
      restore();
      if (on) run().catch(() => {});
    },
  };
}
