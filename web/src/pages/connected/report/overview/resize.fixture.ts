/** Every frame measured at `width` pixels until the returned restore is called. */
export function measuredAt(width: number) {
  const Original = globalThis.ResizeObserver;
  class Measured implements ResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) {
      const rect = { width, height: 240, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 240 };
      const size = [{ inlineSize: width, blockSize: 240 }];
      this.callback(
        [
          {
            target,
            contentRect: { ...rect, toJSON: () => rect },
            borderBoxSize: size,
            contentBoxSize: size,
            devicePixelContentBoxSize: size,
          },
        ],
        this,
      );
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = Measured;
  return () => {
    globalThis.ResizeObserver = Original;
  };
}
