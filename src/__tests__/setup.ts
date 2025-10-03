/**
 * Test setup file for Vitest
 */

import "@testing-library/jest-dom";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock PointerEvent for jsdom
if (typeof PointerEvent === "undefined") {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number;
    width: number;
    height: number;
    pressure: number;
    tangentialPressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    pointerType: string;
    isPrimary: boolean;

    constructor(type: string, params: Record<string, unknown> = {}) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      super(type, params as any);
      this.pointerId = (params.pointerId as number) ?? 0;
      this.width = (params.width as number) ?? 0;
      this.height = (params.height as number) ?? 0;
      this.pressure = (params.pressure as number) ?? 0;
      this.tangentialPressure = (params.tangentialPressure as number) ?? 0;
      this.tiltX = (params.tiltX as number) ?? 0;
      this.tiltY = (params.tiltY as number) ?? 0;
      this.twist = (params.twist as number) ?? 0;
      this.pointerType = (params.pointerType as string) ?? "mouse";
      this.isPrimary = (params.isPrimary as boolean) ?? false;
    }
  } as unknown as typeof PointerEvent;
}

// Setup global test utilities if needed
