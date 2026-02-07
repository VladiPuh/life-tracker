export function waitRafMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let raf = 0;

    const tick = () => {
      const dt = performance.now() - t0;
      if (dt >= ms) {
        if (raf) cancelAnimationFrame(raf);
        resolve();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  });
}
