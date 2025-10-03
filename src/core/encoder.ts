import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { Frame } from '../types';

async function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function createGif(frames: Frame[], options: { fps: number }): Promise<Blob> {
  if (frames.length === 0) {
    throw new Error('No frames to create a GIF.');
  }

  const firstFrameImageData = await dataUrlToImageData(frames[0].dataUrl);
  const { width, height } = firstFrameImageData;

  const gif = GIFEncoder();
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const imageData = await dataUrlToImageData(frame.dataUrl);
    const palette = quantize(imageData.data, 256);
    const index = applyPalette(imageData.data, palette);
    const delay = i < frames.length - 1 ? frames[i + 1].timestamp - frame.timestamp : (1000 / options.fps);
    gif.writeFrame(index, width, height, { palette, delay: Math.max(delay, 20) });
  }

  gif.finish();
  const bytes = gif.bytesView();
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new Blob([ab], { type: 'image/gif' });
}
