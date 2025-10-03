declare module 'gifenc' {
  export interface GIF {
    writeFrame(
      indexedPixels: Uint8Array,
      width: number,
      height: number,
      options: { palette: Uint8Array; delay?: number }
    ): void;
    finish(): void;
    bytesView(): Uint8Array;
  }

  export function GIFEncoder(): GIF;

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors?: number
  ): Uint8Array;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Uint8Array
  ): Uint8Array;
}


