import React from 'react';

export type RecorderState = 'idle' | 'armed' | 'recording' | 'processing' | 'complete';

export interface Frame {
  dataUrl: string;
  timestamp: number;
}

export interface ClickData {
  timestamp: number;
  viewportCoordinates: { x: number; y: number };
  relativeCoordinates: { x: number; y: number };
  elementPath: string;
}

export interface Recording {
  frames: Frame[];
  clickData: ClickData | null;
}

export interface ClickReelProps {
  rootElementId: string;
  scale?: number;
  excludeSelector?: string;
  markerStyle?: React.CSSProperties;
  gifOptions?: {
    fps?: number;
  };
  collectHtml?: boolean;
  hotkey?: string;
}

export interface ClickReelHandle {
  show: () => void;
  hide: () => void;
  toggle: () => void;
  arm: () => void;
  stop: () => void;
  finishAndExport: () => void;
}
