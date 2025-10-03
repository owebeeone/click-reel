/**
 * Type declarations for gifenc library
 */

declare module "gifenc" {
  export interface QuantizeResult {
    colors: Uint8Array;
    palette: Uint8Array;
  }

  export interface QuantizeOptions {
    format?: "rgb565" | "rgb444";
  }

  export interface WriteFrameOptions {
    palette: number[][];
    delay?: number;
    transparent?: boolean;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options: WriteFrameOptions
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(): GIFEncoderInstance;

  export function quantize(
    data: Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions
  ): number[][];

  export function applyPalette(
    data: Uint8ClampedArray,
    palette: number[][],
    format?: string
  ): Uint8Array;
}
