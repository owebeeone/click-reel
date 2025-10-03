import { useState } from 'react';
import { ClickReelProvider, ClickReelRecorder } from '../src';

function App() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <ClickReelProvider>
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Click-Reel Development Playground</h1>
        <p>This is a test environment for the click-reel library.</p>

        <div
          style={{
            margin: '2rem 0',
            padding: '2rem',
            border: '2px dashed #ccc',
            borderRadius: '8px',
            background: '#f9f9f9',
          }}
        >
          <h2>Interactive Test Area</h2>
          <button
            onClick={() => setClickCount((c) => c + 1)}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '1rem',
            }}
          >
            Click Me! ({clickCount})
          </button>

          <button
            onClick={() => setClickCount(0)}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>

          <div style={{ marginTop: '1rem' }}>
            <input
              type="text"
              placeholder="Test input field"
              style={{
                padding: '8px',
                fontSize: '14px',
                width: '300px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label>
              <input type="checkbox" /> Test checkbox
            </label>
          </div>
        </div>

        <div
          style={{ marginTop: '2rem', padding: '1rem', background: '#e8f4f8', borderRadius: '8px' }}
        >
          <h3>Phase 0 Status: ✅ Complete</h3>
          <ul>
            <li>✅ TypeScript setup complete</li>
            <li>✅ Type definitions created</li>
            <li>✅ Dependencies installed</li>
            <li>✅ Demo playground setup</li>
            <li>⏳ Full implementation in subsequent phases</li>
          </ul>
        </div>

        {/* Recorder UI will appear in bottom-right */}
        <ClickReelRecorder />
      </div>
    </ClickReelProvider>
  );
}

export default App;
