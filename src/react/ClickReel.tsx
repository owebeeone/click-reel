// no React value import needed
import { useImperativeHandle, forwardRef } from 'react';
import { useRecorder } from './useRecorder';
import { RecorderUI } from './RecorderUI';
import { ClickReelProps, ClickReelHandle } from '../types';

export const ClickReel = forwardRef<ClickReelHandle, ClickReelProps>((props, ref) => {
  const { 
    state, 
    isVisible, 
    frameCount, 
    armRecorder, 
    stopSession, 
    finishAndExport,
    showUI,
    hideUI,
    toggleUI,
  } = useRecorder(props);

  useImperativeHandle(ref, () => ({
    show: showUI,
    hide: hideUI,
    toggle: toggleUI,
    arm: armRecorder,
    stop: stopSession,
    finishAndExport,
  }), [showUI, hideUI, toggleUI, armRecorder, stopSession, finishAndExport]);

  if (!isVisible) {
    return null;
  }

  return (
    <RecorderUI
      state={state}
      frameCount={frameCount}
      armRecorder={armRecorder}
      stopSession={stopSession}
      finishAndExport={finishAndExport}
    />
  );
});
