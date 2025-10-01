import React from 'react';
import { ClickReel } from './lib';

function App() {
  return (
    <div style={{ border: '2px dashed grey', padding: '2rem' }}>
      <h1>Click-Reel Development Playground</h1>
      <p>This area is for testing the library component below.</p>
      
      {/* This is your library component being tested */}
      <ClickReel />

    </div>
  );
}

export default App;
