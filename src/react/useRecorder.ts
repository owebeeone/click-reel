import { useState, useEffect, useCallback, useRef } from 'react';
import { RecorderState, ClickData, ClickReelProps, Recording } from '../types';
import { getElementPath } from '../utils/dom-utils';
import { captureFrame } from '../core/capture';
import { createGif } from '../core/encoder';
import { generateMetadata, exportToZip } from '../core/metadata';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useRecorder(props: ClickReelProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [isVisible, setIsVisible] = useState(false);
  const recordingRef = useRef<Recording>({ frames: [], clickData: null });
  const [frameCount, setFrameCount] = useState(0);

  const { rootElementId, hotkey = 'Control+Shift+R' } = props;

  // --- State Transitions ---
  const startSession = useCallback(() => setState('idle'), []);
  const armRecorder = useCallback(() => setState('armed'), []);
  const stopSession = useCallback(() => {
    setState('idle');
    recordingRef.current = { frames: [], clickData: null };
    setFrameCount(0);
  }, []);

  // Visibility controls
  const showUI = useCallback(() => setIsVisible(true), []);
  const hideUI = useCallback(() => setIsVisible(false), []);
  const toggleUI = useCallback(() => setIsVisible(v => !v), []);

  // --- Core Capture Logic ---
  const handlePointerDown = useCallback(async (event: PointerEvent) => {
    if (state !== 'armed') return;

    const rootElement = document.getElementById(rootElementId);
    if (!rootElement || !rootElement.contains(event.target as Node)) {
      return;
    }

    // Debug: indicate that Click-Reel has captured this pointer event
    try {
      const targetEl = event.target as HTMLElement | null;
      console.log("Click-Reel: captured pointerdown", {
        target: targetEl?.tagName,
        x: event.clientX,
        y: event.clientY,
      });
    } catch {}

    event.preventDefault();
    event.stopPropagation();
    
    setState('recording');

    const rect = rootElement.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;

    const clickData: ClickData = {
      timestamp: Date.now(),
      viewportCoordinates: { x: event.clientX, y: event.clientY },
      relativeCoordinates: { x: relativeX, y: relativeY },
      elementPath: getElementPath(event.target as HTMLElement, rootElement),
    };
    recordingRef.current.clickData = clickData;

    // Pre-click frame with marker
    const preClickFrameUrl = await captureFrame(rootElement, { ...props, clickPosition: { x: relativeX, y: relativeY } });
    if (preClickFrameUrl === 'error') {
      stopSession(); return;
    }
    recordingRef.current.frames.push({ dataUrl: preClickFrameUrl, timestamp: Date.now() });
    setFrameCount(1);
    
    // Post-click frames heuristic
    let lastFrameDataUrl = preClickFrameUrl;
    const startTime = Date.now();
    await sleep(500); // Initial wait for animations to start

    while (Date.now() - startTime < 4000) {
      const postClickFrameUrl = await captureFrame(rootElement, props);
      if (postClickFrameUrl === 'error') break;

      if (postClickFrameUrl === lastFrameDataUrl) {
          break; // Stop if visually identical
      }
      
      recordingRef.current.frames.push({ dataUrl: postClickFrameUrl, timestamp: Date.now() });
      setFrameCount(prev => prev + 1);
      lastFrameDataUrl = postClickFrameUrl;
      await sleep(100);
    }

    setState('complete');

  }, [state, rootElementId, props, stopSession]);


  // --- Export Logic ---
  const finishAndExport = useCallback(async () => {
    if (recordingRef.current.frames.length === 0) return;
    
    setState('processing');
    try {
      const gifBlob = await createGif(recordingRef.current.frames, { fps: props.gifOptions?.fps ?? 10 });
      const rootElement = document.getElementById(rootElementId);
      if(rootElement) {
        const metadata = generateMetadata(rootElement, recordingRef.current, props.collectHtml ?? true);
        await exportToZip(gifBlob, metadata);
      }
    } catch (error) {
      console.error("Click-Reel: Failed to export.", error);
    } finally {
      stopSession();
    }
  }, [props, rootElementId, stopSession]);

  // --- Event Listeners ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const [ctrl, shift, key] = hotkey.split('+');
        if (
            (ctrl === 'Control' && event.ctrlKey) &&
            (shift === 'Shift' && event.shiftKey) &&
            event.key.toUpperCase() === key.toUpperCase()
        ) {
            event.preventDefault();
            setIsVisible(v => !v);
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkey]);
  
  useEffect(() => {
    if (state === 'armed') {
      document.addEventListener('pointerdown', handlePointerDown, { capture: true });
    }
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    };
  }, [state, handlePointerDown]);


  return {
    state,
    isVisible,
    frameCount,
    startSession,
    armRecorder,
    stopSession,
    finishAndExport,
    showUI,
    hideUI,
    toggleUI,
  };
}
