// Scales fixed-size Figma compositions down to their container on narrower screens.
// Elements opt in with data-fit="<design width in px>" and read the result from --fit.
export function initFit() {
  const targets = document.querySelectorAll<HTMLElement>('[data-fit]');
  if (!targets.length) return;

  const update = (el: HTMLElement) => {
    const designWidth = Number(el.dataset.fit);
    const available = el.parentElement?.clientWidth ?? designWidth;
    const styles = getComputedStyle(el.parentElement!);
    const inner = available - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    el.style.setProperty('--fit', String(Math.min(1, inner / designWidth)));
  };

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const el = (entry.target as HTMLElement).querySelector<HTMLElement>(':scope > [data-fit]');
      if (el) update(el);
    }
  });

  targets.forEach((el) => {
    update(el);
    if (el.parentElement) observer.observe(el.parentElement);
  });
}
