import type React from 'react';
import Draggable from 'react-draggable';
import { Target, CircleDot, Download, Trash2 } from 'lucide-react';
import { RecorderState } from '../types';

interface RecorderUIProps {
  state: RecorderState;
  frameCount: number;
  armRecorder: () => void;
  stopSession: () => void;
  finishAndExport: () => void;
}

const buttonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '8px',
  cursor: 'pointer',
  color: '#E0E0E0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const disabledStyle: React.CSSProperties = {
  ...buttonStyle,
  cursor: 'not-allowed',
  color: '#666',
};

export const RecorderUI: React.FC<RecorderUIProps> = ({ state, frameCount, armRecorder, stopSession, finishAndExport }) => {
  return (
    <Draggable handle=".handle">
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(40, 40, 40, 0.9)',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        fontFamily: 'sans-serif',
      }}>
        <div className="handle" style={{ cursor: 'move', padding: '8px', color: '#888' }}>
          <CircleDot size={18} />
        </div>

        <div style={{
          width: '60px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#A0A0A0'
        }}>
          {state === 'idle' && 'Idle'}
          {state === 'armed' && 'Armed'}
          {state === 'recording' && '...'}
          {state === 'processing' && '...'}
          {state === 'complete' && `Done`}
        </div>

        <div style={{ borderLeft: '1px solid #555', margin: '0 4px', height: '30px' }} />

        <button 
          style={state !== 'idle' ? disabledStyle : buttonStyle} 
          onClick={armRecorder} 
          disabled={state !== 'idle'}
          title="Arm Recorder (Record next click)"
        >
          <Target size={20} />
        </button>

        <div style={{
          width: '40px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#ccc'
        }}>{frameCount}</div>

        <button 
          style={state === 'idle' || state === 'armed' ? disabledStyle : buttonStyle} 
          onClick={finishAndExport} 
          disabled={state === 'idle' || state === 'armed'}
          title="Finish and Export"
        >
          <Download size={20} />
        </button>
        
        <button 
          style={state === 'idle' || state === 'armed' ? disabledStyle : buttonStyle} 
          onClick={stopSession} 
          disabled={state === 'idle' || state === 'armed'}
          title="Discard Recording"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </Draggable>
  );
};
