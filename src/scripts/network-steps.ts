// Network steps 2–4, markup in NetworkVisuals.astro. Same contract as network-connect.ts:
// toggle(true) plays the step from the start, toggle(false) drops back to the finished frame.
// Concepts follow happenstance.ai's own showcase:
// - Map: the network bursts out of "You" along its lines, then the groups and ranking land.
// - Friends: the discs open, friends and groups join, and the path to a friend of a friend draws.
// - Search: the query types, a sweep lights up everyone searched, then the warm path draws.

import { createSequence, EASE_SETTLE } from './motion';

type Seq = ReturnType<typeof createSequence>;
interface Ctx extends Seq {
  count: (el: Element, delay: number, duration?: number) => void;
  $: <T extends Element = HTMLElement>(sel: string) => T;
  $$: <T extends Element = HTMLElement>(sel: string) => T[];
}

const popIn: Keyframe[] = [
  { opacity: 0, transform: 'scale(0.5)' },
  { opacity: 1, transform: 'none' },
];
const rise: Keyframe[] = [
  { opacity: 0, transform: 'translateY(8px)' },
  { opacity: 1, transform: 'none' },
];
// Dash-offset draw (a zero-length dash would still paint a dot with round caps).
const UNDRAWN: Keyframe = { strokeDasharray: '100 101', strokeDashoffset: 101 };
const drawLine: Keyframe[] = [UNDRAWN, { strokeDasharray: '100 101', strokeDashoffset: 0 }];

/** Starts each person from a point pulled toward the hub, so they burst outward. */
const burst = (el: HTMLElement, hub: { x: number; y: number }, pull = 0.55): Keyframe[] => {
  const dx = (hub.x - Number(el.dataset.cx)) * pull;
  const dy = (hub.y - Number(el.dataset.cy)) * pull;
  return [
    { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.4)` },
    { opacity: 1, transform: 'none' },
  ];
};

const distance = (el: HTMLElement, hub: { x: number; y: number }) =>
  Math.hypot(Number(el.dataset.cx) - hub.x, Number(el.dataset.cy) - hub.y);

/** Wraps a step: owns its sequence, counters, and the restore-to-finished-frame on stop. */
function step(root: HTMLElement, run: (ctx: Ctx) => Promise<void>, restoreExtra?: () => void) {
  const seq = createSequence(root);
  let running = false;
  let rafs: number[] = [];

  const counters = [...root.querySelectorAll<HTMLElement>('[data-count]')];
  counters.forEach((el) => (el.dataset.final = el.textContent ?? ''));

  /** Rolls a figure like "178,683", "18.4k" or "12" up from zero to its final text. */
  const count = (el: Element, delay: number, duration = 1100) => {
    const node = el as HTMLElement;
    const final = node.dataset.final ?? '';
    const [, num = '0', suffix = ''] = final.match(/^([\d.,]+)(.*)$/) ?? [];
    const target = Number(num.replace(/,/g, ''));
    const decimals = num.includes('.') ? num.split('.')[1].length : 0;
    const commas = num.includes(',');
    const show = (v: number) => {
      const text = commas ? Math.round(v).toLocaleString('en-US') : v.toFixed(decimals);
      node.textContent = text + suffix;
    };
    show(0);
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      show(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) rafs.push(requestAnimationFrame(tick));
    };
    rafs.push(requestAnimationFrame(tick));
  };

  const ctx: Ctx = {
    ...seq,
    count,
    $: (sel) => root.querySelector(sel)!,
    $$: (sel) => [...root.querySelectorAll(sel)] as never,
  };

  const restore = () => {
    rafs.forEach(cancelAnimationFrame);
    rafs = [];
    counters.forEach((el) => (el.textContent = el.dataset.final ?? ''));
    restoreExtra?.();
  };

  return {
    toggle(on: boolean) {
      if (on === running) return;
      running = on;
      seq.reset();
      restore();
      if (on) run(ctx).catch(() => {});
    },
  };
}

/* ---- 02 · Happenstance maps your network ---- */
export function initMap(root: HTMLElement) {
  const HUB = { x: 99.5, y: 206.3 };
  const REVEAL_MS = 1500;
  const REVEAL_R = 470;

  return step(root, async ({ play, wait, count, $, $$ }) => {
    play($('[data-map]'), [{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'none' }], {
      duration: 1100,
    });
    play($('[data-you]'), popIn, { duration: 620, delay: 80, easing: EASE_SETTLE });
    play($('[data-halo]'), [{ opacity: 0, transform: 'scale(0.3)' }, { opacity: 1, transform: 'none' }], {
      duration: 800,
      delay: 160,
    });

    // Lines spread out of "You"; each person arrives as the front reaches them.
    play($('[data-reveal]'), [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      duration: REVEAL_MS,
      delay: 380,
      easing: 'cubic-bezier(0.3, 0, 0.3, 1)',
    });
    $$('[data-person]').forEach((el) => {
      const at = 380 + (distance(el, HUB) / REVEAL_R) * REVEAL_MS * 0.85;
      play(el, burst(el, HUB, 0.35), { duration: 680, delay: at, easing: EASE_SETTLE });
    });

    // The total ticks up while the network spreads, then groups and ranking settle in.
    const total = $('.nv-total');
    play(total, rise, { duration: 520, delay: 520 });
    count(total.querySelector('[data-count]')!, 620, 1700);
    $$('.nv-pill:not(.nv-total)').forEach((pill, i) => {
      play(pill, rise, { duration: 560, delay: 1500 + i * 130 });
      count(pill.querySelector('[data-count]')!, 1560 + i * 130, 900);
    });
    play($('[data-legend]'), rise, { duration: 560, delay: 2050 });
    $$('[data-bar]').forEach((bar, i) =>
      play(bar, [{ transform: 'scaleY(0)' }, { transform: 'none' }], {
        duration: 420,
        delay: 2250 + Math.floor(i / 3) * 140 + (i % 3) * 60,
        easing: EASE_SETTLE,
      }),
    );
    await wait(2900);

    // Idle: "You" keeps a slow, breathing halo.
    play(
      $('[data-halo]'),
      [
        { transform: 'none', opacity: 1 },
        { transform: 'scale(1.22)', opacity: 0.55 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 2600, iterations: Infinity, easing: 'ease-in-out', fill: 'none' },
    );
  });
}

/* ---- 03 · Add friends, join groups ---- */
export function initFriends(root: HTMLElement) {
  const HUB = { x: 293.5, y: 250 };

  return step(root, async ({ play, wait, count, $, $$ }) => {
    play($('[data-glow]'), [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'none' }], {
      duration: 1000,
    });
    // The discs are in paint order (outer first); open them from the centre outwards.
    $$('[data-ring]').reverse().forEach((ring, i) =>
      play(ring, [{ opacity: 0, transform: 'scale(0.7)' }, { opacity: 1, transform: 'none' }], {
        duration: 900,
        delay: 80 + i * 140,
      }),
    );
    play($('[data-you]'), popIn, { duration: 620, easing: EASE_SETTLE });

    // Friends: spokes draw out, each friend lands at the end of one.
    $$('[data-spoke]').forEach((line, i) =>
      play(line, drawLine, { duration: 420, delay: 360 + i * 90, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }),
    );
    $$('[data-friend]').forEach((el, i) =>
      play(el, burst(el, HUB, 0.6), { duration: 600, delay: 560 + i * 90, easing: EASE_SETTLE }),
    );
    play($('[data-add]'), popIn, { duration: 560, delay: 1020, easing: EASE_SETTLE });

    // Groups join, and the legend counts up the wider network they bring.
    $$('[data-pill]').forEach((pill, i) => {
      play(pill, rise, { duration: 520, delay: 1250 + i * 150 });
      count(pill.querySelector('[data-count]')!, 1300 + i * 150, 800);
    });
    play($('[data-legend]'), rise, { duration: 520, delay: 1700 });
    $$('[data-legend] [data-count]').forEach((el, i) => count(el, 1800 + i * 120, i === 2 ? 1300 : 700));

    // A friend of a friend: the dashed path runs from Sarah out to Maya.
    play($('[data-reveal]'), [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      duration: 700,
      delay: 2650,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    });
    play($('[data-target]'), popIn, { duration: 600, delay: 3150, easing: EASE_SETTLE });
    play($('[data-tip]'), [{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], {
      duration: 520,
      delay: 3300,
    });
    await wait(3800);

    // Idle: the add-friend button keeps inviting.
    play(
      $('[data-add]'),
      [
        { boxShadow: '0 0 0 0 rgba(61, 133, 247, 0.28)' },
        { boxShadow: '0 0 0 10px rgba(61, 133, 247, 0)' },
      ],
      { duration: 1800, iterations: Infinity, easing: 'ease-out', fill: 'none' },
    );
  });
}

/* ---- 04 · Search for anyone ---- */
export function initSearch(root: HTMLElement) {
  const HUB = { x: 294, y: 250 };
  const text = root.querySelector<HTMLElement>('[data-query-text]')!;
  const query = text.textContent ?? '';

  return step(
    root,
    async ({ play, wait, typeText, count, $, $$ }) => {
      play($('[data-glow]'), [{ opacity: 0 }, { opacity: 1 }], { duration: 700 });

      // 1. The query types itself in.
      text.textContent = '';
      const caret = $('[data-caret]');
      play($('[data-query]'), rise, { duration: 480, delay: 80 });
      play(caret, [{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.51 }, { opacity: 0 }], {
        duration: 900,
        iterations: Infinity,
        fill: 'none',
      });
      // Everything the search finds stays hidden until its own reveal takes over.
      const hold = (el: Element, frame: Keyframe) => play(el, [frame, frame], { duration: 1, iterations: Infinity });
      const held = [
        ...$$('[data-hop]').map((el) => hold(el, { opacity: 0 })),
        ...$$('[data-searched]').map((el) => hold(el, { opacity: 0 })),
        ...$$('[data-warm]').map((el) => hold(el, UNDRAWN)),
        hold($('[data-result]'), { opacity: 0 }),
        hold($('[data-legend]'), { opacity: 0 }),
      ];
      await wait(420);
      await typeText(text, query, 16);

      // 2. A sweep goes out from "You" and lights up everyone it searches.
      const sweep = (delay: number, strength = 1) =>
        play(
          $('[data-sonar]'),
          [
            { opacity: 0, transform: 'scale(0.18)' },
            { opacity: strength, offset: 0.15 },
            { opacity: 0, transform: 'scale(1.08)' },
          ],
          { duration: 1500, delay, easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)', fill: 'none' },
        );
      held.forEach((a) => a.cancel());
      sweep(0);
      $$('[data-searched]').forEach((el) => {
        const at = (distance(el, HUB) / 216) * 1100;
        play(
          el,
          [
            { opacity: 0, transform: 'scale(0.6)' },
            { opacity: 1, transform: 'scale(1.08)', offset: 0.4 },
            { opacity: 0.45, transform: 'none' },
          ],
          { duration: 900, delay: at },
        );
      });
      play($('[data-legend]'), rise, { duration: 480, delay: 100 });
      count($('[data-legend] [data-count]'), 160, 1200);

      // 3. Then the warm path draws: you → Rahul → Leo, and the result card lands.
      const T = 1100;
      const [toRahul, toLeo] = $$('[data-warm]');
      const [rahul, leo] = $$('[data-hop]');
      play(toRahul, drawLine, { duration: 420, delay: T, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
      play(rahul, popIn, { duration: 560, delay: T + 300, easing: EASE_SETTLE });
      play(toLeo, drawLine, { duration: 380, delay: T + 480, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
      play(leo, popIn, { duration: 620, delay: T + 760, easing: EASE_SETTLE });
      play($('[data-result]'), [{ opacity: 0, transform: 'translateY(-8px) scale(0.98)' }, { opacity: 1, transform: 'none' }], {
        duration: 560,
        delay: T + 900,
      });
      await wait(T + 1500);

      // Idle: a soft sweep now and then, and light runs along the warm path.
      play(
        $('[data-flow]'),
        [
          { opacity: 0, strokeDashoffset: 10 },
          { opacity: 1, offset: 0.1 },
          { opacity: 1, offset: 0.85 },
          { opacity: 0, strokeDashoffset: -100 },
        ],
        { duration: 1600, iterations: Infinity, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'none', endDelay: 900 },
      );
      for (;;) {
        sweep(0, 0.45);
        await wait(3200);
      }
    },
    () => (text.textContent = query),
  );
}
