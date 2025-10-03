import * as htmlToImage from 'html-to-image';
import { ClickReelProps } from '../types';

interface CaptureOptions extends Pick<ClickReelProps, 'scale' | 'excludeSelector' | 'markerStyle'> {
  clickPosition?: { x: number; y: number };
}

const defaultMarkerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: 'rgba(255, 0, 0, 0.5)',
  border: '2px solid rgba(255, 255, 255, 0.7)',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  zIndex: 999999,
};

export async function captureFrame(rootElement: HTMLElement, options: CaptureOptions): Promise<string> {
  const { scale = 1, excludeSelector, clickPosition, markerStyle } = options;
  let elementToCapture: HTMLElement = rootElement;
  let clonedElement: HTMLElement | null = null;

  try {
    if (clickPosition) {
      clonedElement = rootElement.cloneNode(true) as HTMLElement;
      
      const marker = document.createElement('div');
      const finalMarkerStyle = { ...defaultMarkerStyle, ...markerStyle };
      Object.assign(marker.style, finalMarkerStyle);
      
      marker.style.left = `${clickPosition.x}px`;
      marker.style.top = `${clickPosition.y}px`;
      
      clonedElement.style.position = 'relative';
      clonedElement.appendChild(marker);
      elementToCapture = clonedElement;
    }
    
    const dataUrl = await htmlToImage.toPng(elementToCapture, {
      pixelRatio: scale,
      filter: (node: HTMLElement) => {
        if (excludeSelector && node.matches && node.matches(excludeSelector)) {
          return false;
        }
        return true;
      },
    });

    return dataUrl;
  } catch (error) {
    console.error('Click-Reel: Failed to capture frame.', error);
    return 'error'; // Return a specific string to signal failure
  }
}
