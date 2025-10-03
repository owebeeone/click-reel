import JSZip from 'jszip';
import { Recording } from '../types';

export function generateMetadata(rootElement: HTMLElement, recording: Recording, collectHtml: boolean): object {
  const { clickData } = recording;

  const metadata = {
    createdAt: new Date().toISOString(),
    clickData,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scroll: {
      x: window.scrollX,
      y: window.scrollY,
    },
    htmlSnapshot: collectHtml ? rootElement.outerHTML : undefined,
  };
  
  return metadata;
}

export async function exportToZip(gifBlob: Blob, metadata: object): Promise<void> {
  const zip = new JSZip();
  zip.file('recording.gif', gifBlob);
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  const content = await zip.generateAsync({ type: 'blob' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `click-reel-recording-${new Date().toISOString()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
