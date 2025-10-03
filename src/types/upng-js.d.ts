/**
 * Type declarations for upng-js library
 */

declare module "upng-js" {
  interface UPNG {
    encode(
      frames: ArrayBuffer[],
      width: number,
      height: number,
      cnum: number,
      delays?: number[]
    ): ArrayBuffer;

    decode(buffer: ArrayBuffer): {
      width: number;
      height: number;
      depth: number;
      ctype: number;
      frames: ArrayBuffer[];
      tabs: Record<string, unknown>;
    };

    toRGBA8(buffer: {
      frames: ArrayBuffer[];
      width: number;
      height: number;
    }): ArrayBuffer[];
  }

  const upng: UPNG;
  export default upng;
}
