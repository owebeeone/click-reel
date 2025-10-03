import React, { useState } from 'react';
import { ClickReel } from './react/ClickReel';

function App() {
  const [showBox, setShowBox] = useState(false);

  return (
    <div id="capture-root" style={{ 
        padding: '2rem', 
        background: '#333',
        border: '1px solid #555',
        borderRadius: '8px',
        minHeight: '80vh',
    }}>
      <h1>Click-Reel Playground</h1>
      <p>Press Ctrl+Shift+R to toggle the recorder UI.</p>
      
      <button 
        onClick={() => setShowBox(!showBox)}
        style={{ marginBottom: '20px', padding: '10px 20px' }}
      >
        Toggle Animated Box
      </button>

      {showBox && (
        <div style={{
          width: '100px',
          height: '100px',
          background: 'royalblue',
          borderRadius: '8px',
          transition: 'all 0.5s ease-in-out',
          transform: showBox ? 'translateX(200px) rotate(90deg)' : 'translateX(0) rotate(0)',
        }} />
      )}

      <p data-click-reel-exclude>This paragraph will be excluded from screenshots.</p>

      {/* The ClickReel component itself is invisible until toggled */}
      <ClickReel rootElementId="capture-root" />
    </div>
  );
}

export default App;
