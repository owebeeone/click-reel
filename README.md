# @owebeeone/click-reel

**Browser-side interaction recorder with 2-line integration** 


[![GitHub Repo](https://img.shields.io/badge/Repo-owebeeone%2Fclick--reel-181717?logo=github)](https://github.com/owebeeone/click-reel)


Capture annotated screenshots of user interactions and export as GIF, APNG, or ZIP bundles. Includes draggable UI, PII obfuscation, and full keyboard control.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Status

🎉 **Phase 11 (Integration & Polish) - In Progress**

The library is now feature-complete with all core functionality implemented! Currently in final integration and polish phase.

## Features

- ✅ **Smart Capture** - Pre and post-interaction screenshots with intelligent settling detection
- ✅ **Visual Markers** - Annotated click locations with customizable styles
- ✅ **Animated Output** - Export as GIF, APNG, or ZIP with configurable quality
- ✅ **Individual Frames** - ZIP exports include both `pngs/` and `gifs/` folders with individual frame files
- ✅ **Persistent Storage** - Save recordings to IndexedDB with full CRUD operations
- ✅ **Privacy Mode** - Built-in PII obfuscation with CSS class-based control (`pii-enable`/`pii-disable`)
- ✅ **Keyboard Shortcuts** - Fully configurable hotkeys for all actions
- ✅ **Metadata Export** - Comprehensive JSON metadata with DOM paths, coordinates, and scroll positions
- ✅ **Customizable UI** - Draggable, minimizable recorder interface with modern design
- ✅ **Inventory Management** - View, search, sort, and manage saved reels
- ✅ **Playback UI** - Frame-by-frame playback with metadata display
- ✅ **Settings Panel** - User preferences with logarithmic time controls and persistence
- ✅ **Auto-Named Recordings** - Recordings automatically named with filesystem-safe YYYY-MM-DD format

## Installation

```bash
npm install @owebeeone/click-reel
```

> **Note**: Library is under active development. Public npm installation will be available after Phase 14 (npm publish).

## Quick Start

### Step 1: Install Dependencies

```bash
npm install @owebeeone/click-reel @dnd-kit/core @dnd-kit/utilities
```

### Step 2: Add to Your App

```tsx
import { ClickReelProvider, ClickReelComplete } from '@owebeeone/click-reel';

function App() {
  return (
    <ClickReelProvider>
      <YourApp />
      <ClickReelComplete />
    </ClickReelProvider>
  );
}
```

**That's it!** ✨ 

This single component gives you everything:
- 🎯 **Draggable recorder** - Move it anywhere, position persists across reloads
- ⚙️ **Settings panel** - Customize timings, markers, and behavior
- 📚 **Inventory** - Manage and export saved recordings
- 🔒 **Privacy mode** - Built-in PII obfuscation
- ⌨️ **Keyboard shortcuts** - Control everything without the mouse
- 🪟 **Smart positioning** - Auto-adjusts when window resizes, never goes off-screen

### Optional: Customize

```tsx
<ClickReelComplete 
  initialPosition={{ x: 100, y: 100 }}  // Custom starting position
  startMinimized={true}                 // Start collapsed
/>
```

> **Note**: To control visibility on startup, use the Settings panel (Ctrl+Shift+G) → Recorder UI → "Show on Startup"

---

### When NOT to Use `<ClickReelComplete />`

**99% of users should use `<ClickReelComplete />`.** Only use alternatives if:

1. **You don't want `@dnd-kit` dependencies** → Use [Basic Integration](#alternative-integrations) (fixed-position recorder)
2. **You have a custom drag system** → Use [Manual Integration](#manual-integration-advanced) (full control)
3. **You're building a custom recorder UI** → Use individual components

<details>
<summary><strong>Show alternative integration methods</strong></summary>

<a name="alternative-integrations"></a>

#### Comparison Table

| Feature | **Complete** ⭐ | Basic | Manual |
|---------|----------|-------|---------|
| Recording & Playback | ✅ | ✅ | ✅ |
| Settings & Inventory | ✅ | ❌ | ✅ |
| **Draggable** | **✅** | ❌ | ✅ |
| **Position Persistence** | **✅** | ❌ | ✅ |
| **Auto Bounds Checking** | **✅** | ❌ | ✅ |
| **Setup Lines** | **~5** | ~3 | ~60 |
| **Dependencies** | `@dnd-kit/*` | None extra | `@dnd-kit/*` |

#### Basic Integration (No Dragging)

Minimal setup with no extra dependencies:

```tsx
import { ClickReelProvider, ClickReelRecorder } from '@owebeeone/click-reel';

function App() {
  return (
    <ClickReelProvider>
      <YourApp />
      <ClickReelRecorder />
    </ClickReelProvider>
  );
}
```

**Limitations:** Fixed position (top-right), no settings panel, no inventory.

#### Manual Integration

For advanced control, see [Manual Integration](#manual-integration) section below.

</details>

### Keyboard Shortcuts (Default)

- `Ctrl+Shift+R` - Toggle recorder visibility
- `Ctrl+Shift+S` - Start/stop recording
- `Ctrl+Shift+A` - Arm capture mode (click to capture)
- `Ctrl+Shift+F` - Add frame manually
- `Ctrl+Shift+O` - Toggle obfuscation
- `Ctrl+Shift+G` - Open settings
- `Ctrl+Shift+E` - Open inventory/saved reels

### PII Protection

Mark sensitive content with CSS classes:

```html
<!-- Obfuscate this content and all children -->
<div class="pii-enable">
  <input type="text" placeholder="User's email" />
  <span>John Doe</span>
</div>

<!-- Exempt specific content from obfuscation -->
<div class="pii-enable">
  <h1>User Profile</h1>
  <div class="pii-disable">
    <!-- Buttons and labels won't be obfuscated -->
    <button>Save</button>
    <button>Cancel</button>
  </div>
  <input type="text" value="john@example.com" /> <!-- Will be obfuscated -->
</div>
```

## Manual Integration (Advanced)

> ⚠️ **Advanced Users Only** - Most users should use [`<ClickReelComplete />`](#quick-start) instead. This section is for edge cases where you need full control over drag behavior, position management, or custom recorder UI.

### When You Need Manual Integration

**Only use this if:**
- ✅ You have an existing custom drag-and-drop system and can't use `@dnd-kit`
- ✅ You need to integrate recorder position with external state management
- ✅ You're building a custom recorder UI from scratch

**If you just want to customize the recorder's behavior, use `<ClickReelComplete />` props instead!**

### Common Pitfalls

If you proceed with manual integration, watch out for:

⚠️ **Forgetting peer dependencies** - Requires `@dnd-kit/core` and `@dnd-kit/utilities`  
⚠️ **Not wrapping with DndContext** - Recorder won't be draggable  
⚠️ **React version conflicts** - Ensure only one React version (`npm list react`)  
⚠️ **Missing position sanitization** - Users can drag recorder off-screen  
⚠️ **No resize handling** - Recorder stays off-screen after window resize  

### 1. Install Peer Dependencies

Click Reel requires `@dnd-kit` for drag-and-drop functionality:

```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

### 2. Wrap Your App with Providers

```tsx
import { ClickReelProvider, ClickReelRecorder, ClickReelSettings, ClickReelInventory } from '@owebeeone/click-reel';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState, useEffect } from 'react';

function App() {
  // 1. Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  // 2. Manage recorder position state
  const [recorderPosition, setRecorderPosition] = useState(() => {
    try {
      const stored = localStorage.getItem('click-reel-position');
      const position = stored
        ? JSON.parse(stored)
        : { x: window.innerWidth - 300, y: 20 };

      // Sanitize the loaded position
      return sanitizeRecorderPosition(position);
    } catch {
      return sanitizeRecorderPosition({ x: window.innerWidth - 300, y: 20 });
    }
  });

  // 3. Handle window resize - reposition recorder if it's now off-screen
  useEffect(() => {
    const handleResize = () => {
      setRecorderPosition((prev) => sanitizeRecorderPosition(prev));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 4. Handle drag end
  const handleDragEnd = (event: any) => {
    if (event.active.id === 'click-reel-recorder') {
      const newPosition = sanitizeRecorderPosition({
        x: recorderPosition.x + event.delta.x,
        y: recorderPosition.y + event.delta.y,
      });
      setRecorderPosition(newPosition);
      try {
        localStorage.setItem('click-reel-position', JSON.stringify(newPosition));
      } catch (err) {
        console.warn('Failed to save recorder position:', err);
      }
    }
  };

  return (
    <ClickReelProvider>
      <YourApp />
      
      {/* Draggable recorder with DndContext */}
      <DndContext 
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <ClickReelRecorder position={recorderPosition} />
      </DndContext>
      
      {/* Settings and Inventory panels */}
      <ClickReelSettings />
      <ClickReelInventory />
    </ClickReelProvider>
  );
}

/**
 * Sanitize recorder position to ensure it's within the viewport
 */
function sanitizeRecorderPosition(pos: { x: number; y: number }): {
  x: number;
  y: number;
} {
  const recorderWidth = 280; // Approximate width of the recorder
  const recorderHeight = 400; // Approximate height of the recorder
  const minMargin = 20; // Minimum margin from viewport edges

  // Ensure position is within viewport bounds
  const maxX = window.innerWidth - recorderWidth - minMargin;
  const maxY = window.innerHeight - recorderHeight - minMargin;

  return {
    x: Math.max(minMargin, Math.min(pos.x, maxX)),
    y: Math.max(minMargin, Math.min(pos.y, maxY)),
  };
}

export default App;
```

### 3. Component Options

#### ClickReelRecorder Props

```tsx
interface ClickReelRecorderProps {
  /** Current position (controlled by parent for dragging) */
  position?: { x: number; y: number };
  /** Whether the recorder is visible */
  visible?: boolean;
  /** Initial collapsed state */
  initialCollapsed?: boolean;
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
}
```

#### ClickReelInventory Props

```tsx
interface ClickReelInventoryProps {
  /** Custom storage service (optional) */
  storageService?: StorageService;
  /** Callback when "Start Recording" is clicked */
  onStartRecording?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}
```

### 4. Customization Examples

#### Custom Initial Position

```tsx
<ClickReelRecorder position={{ x: 100, y: 100 }} />
```

#### Start Minimized

```tsx
<ClickReelRecorder initialCollapsed={true} />
```

#### Control Visibility Programmatically

```tsx
const [visible, setVisible] = useState(true);

<ClickReelRecorder 
  visible={visible}
  position={recorderPosition}
/>
```

#### Custom Recorder State Handler

```tsx
const handleCollapsedChange = (collapsed: boolean) => {
  console.log('Recorder collapsed:', collapsed);
  // Optionally save to localStorage or context
};

<ClickReelRecorder 
  onCollapsedChange={handleCollapsedChange}
  position={recorderPosition}
/>
```

## Usage Workflows

### Recording Interactions

1. **Start Recording**: Click "Start Recording" or press `Ctrl+Shift+S`
2. **Capture Interactions**: Choose one of two modes:
   - **Arm Mode** (`Ctrl+Shift+A`): Click anywhere on the page to capture that interaction
   - **Manual Mode** (`Ctrl+Shift+F`): Manually capture the current view
3. **Stop Recording**: Click "Stop Recording" or press `Ctrl+Shift+S` again

### Viewing Saved Recordings

1. **Open Inventory**: Click the inventory icon or press `Ctrl+Shift+E`
2. **Browse Recordings**: Scroll through your saved reels
3. **Play Recording**: Click "Play" to view frame-by-frame playback
4. **Export**: Choose GIF, APNG, or ZIP format

### Managing Privacy

1. **Enable Obfuscation**: Click the PII indicator on the recorder or press `Ctrl+Shift+O`
2. **Mark Sensitive Areas**: Add `pii-enable` class to HTML elements
3. **Preview**: Use the "Preview PII" button to see what will be obfuscated
4. **Record**: All new captures will obfuscate marked content

### Customizing Settings

1. **Open Settings**: Click the settings icon or press `Ctrl+Shift+G`
2. **Adjust Capture Timings**: Configure post-click delays and settlement detection
3. **Marker Style**: Customize size and color of click markers
4. **Recorder UI**: Configure startup behavior and visibility preferences
5. **Save**: Click "Save" to persist your preferences

### Exporting Recordings

#### As Animated Files

1. Select a recording from inventory
2. Click "Export as GIF" or "Export as APNG"
3. Wait for encoding (progress bar shows status)
4. File downloads automatically

#### As ZIP Bundle

1. Select a recording from inventory
2. Click "Export as ZIP"
3. Bundle includes:
   - Animated GIF and APNG
   - Individual PNG frames (`pngs/` folder)
   - Individual GIF frames (`gifs/` folder)
   - Metadata JSON
   - Standalone HTML viewer

### Keyboard Shortcuts Reference

| Action | Shortcut | Available When |
|--------|----------|----------------|
| Toggle Recorder | `Ctrl+Shift+R` | Always |
| Start/Stop Recording | `Ctrl+Shift+S` | Recorder visible |
| Arm Capture | `Ctrl+Shift+A` | Recording active |
| Add Frame | `Ctrl+Shift+F` | Recording active |
| Toggle Obfuscation | `Ctrl+Shift+O` | Recorder visible |
| Open Settings | `Ctrl+Shift+G` | Recorder visible |
| Open Inventory | `Ctrl+Shift+E` | Recorder visible |

> **Note**: These shortcuts work cross-platform with `Ctrl+Shift` on both macOS and Windows/Linux.

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build library
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format
```

### Project Structure

```
click-reel/
├── src/              # Library source code
│   ├── types/        # TypeScript type definitions
│   ├── react/        # React components and hooks
│   ├── core/         # Core business logic (to be implemented)
│   ├── utils/        # Utility functions
│   └── index.ts      # Main entry point
├── demo/             # Development playground
├── dist/             # Built library files
└── docs/             # Documentation (to be created)
```

## Advanced Integration

### Vite Configuration

If you're using Vite and integrating a local development version of Click Reel, ensure React is deduplicated:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    exclude: ['@owebeeone/click-reel']
  }
})
```

### TypeScript Configuration

Add the library types to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@owebeeone/click-reel"]
  }
}
```

### Troubleshooting

#### Recorder Not Draggable

**Problem:** The recorder panel appears but won't drag.

**Solution:** Ensure you've:
1. Installed `@dnd-kit/core` and `@dnd-kit/utilities`
2. Wrapped `<ClickReelRecorder>` with `<DndContext>`
3. Configured `PointerSensor` correctly
4. Passed the `position` prop to `<ClickReelRecorder>`

#### React Context Errors

**Problem:** `TypeError: Cannot read properties of undefined (reading 'ReactCurrentDispatcher')`

**Solution:** This indicates React version conflicts. Make sure:
- `@dnd-kit` packages are **peer dependencies** (not bundled)
- Your Vite config deduplicates React (see [Vite Configuration](#vite-configuration))
- All React packages use the same version (check with `npm list react`)

#### Keyboard Shortcuts Not Working

**Problem:** Pressing keyboard shortcuts has no effect.

**Solution:** Check that:
- `<ClickReelProvider>` wraps your entire app
- The keyboard shortcuts don't conflict with browser shortcuts
- The recorder is visible (hidden recorders don't respond to shortcuts except `Ctrl+Shift+R`)

#### Position Not Persisting

**Problem:** Recorder position resets after page reload.

**Solution:** Ensure:
- The `handleDragEnd` function saves to `localStorage`
- `localStorage` is available (not disabled in browser settings)
- The position is loaded and sanitized on mount

#### Recorder Off-Screen After Window Resize

**Problem:** After resizing the browser window, the recorder is partially or fully off-screen.

**Solution:** Add a window resize listener that calls `sanitizeRecorderPosition()`:

```tsx
useEffect(() => {
  const handleResize = () => {
    setRecorderPosition((prev) => sanitizeRecorderPosition(prev));
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

## Technology Stack

- **TypeScript 5.9** - Type-safe development
- **React 18/19** - UI components and hooks (supports both versions)
- **html-to-image** - DOM-to-canvas rasterization
- **gifenc** - High-performance GIF encoding
- **upng-js** - APNG encoding
- **jszip** - ZIP archive creation for frame bundles
- **idb** - Promise-based IndexedDB wrapper
- **@dnd-kit** - Drag-and-drop for recorder UI
- **lucide-react** - Modern icon library
- **react-hotkeys-hook** - Keyboard shortcut management
- **Vite** - Lightning-fast build tooling
- **Vitest** - Unit testing framework

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

This project is currently in active development. Contribution guidelines will be published after Phase 12 (documentation).

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Specification

For detailed feature specifications, see [CLICK-REEL-SPEC.md](./CLICK-REEL-SPEC.md).

## API Overview

### Core Components

- `<ClickReelProvider>` - Context provider for global state (required)
- **`<ClickReelComplete>`** ⭐ - All-in-one component with full functionality (recommended)
- `<ClickReelRecorder>` - Main recorder UI with controls (for manual integration)
- `<ClickReelInventory>` - Saved reels browser and manager (for manual integration)
- `<ClickReelSettings>` - Settings panel wrapper (for manual integration)
- `<SettingsPanel>` - User preferences configuration (internal component)

### Hooks

- `useRecorder()` - Recording state and control functions
- `useStorage()` - IndexedDB operations (save, load, delete reels)
- `usePreferences()` - User settings with persistence
- `useKeyboardShortcuts()` - Configurable hotkey management

### Core Functions

- `captureFrame()` - Capture a screenshot with markers
- `exportReel()` - Export reel as GIF/APNG/ZIP
- `obfuscateInPlace()` - PII obfuscation for privacy

## Export Formats

### ZIP Bundle Contents

When exporting as ZIP, you get a complete package:

```
recording-YYYY-MM-DD_HH_MM_SS.zip
├── recording-YYYY-MM-DD_HH_MM_SS.gif          # Animated GIF
├── recording-YYYY-MM-DD_HH_MM_SS.png          # Animated APNG
├── pngs/                                       # Individual PNG frames
│   ├── frame-001.png
│   ├── frame-002.png
│   └── ...
├── gifs/                                       # Individual GIF frames
│   ├── frame-001.gif
│   ├── frame-002.gif
│   └── ...
├── recording-YYYY-MM-DD_HH_MM_SS-metadata.json
└── recording-YYYY-MM-DD_HH_MM_SS-viewer.html
```

**Benefits:**
- **Animated files** for immediate playback
- **Individual PNGs** for high-quality frame-by-frame analysis
- **Individual GIFs** for universal compatibility
- **Metadata** for programmatic access to recording details
- **HTML viewer** for standalone playback


