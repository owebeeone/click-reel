# @owebeeone/click-reel

A browser-side interaction recorder that captures annotated screenshots of user interactions and assembles them into animated GIF/APNG files with metadata.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Status

🎉 **Phase 11 (Integration & Polish) - In Progress**

The library is now feature-complete with all core functionality implemented! Currently in final integration and polish phase.

## Features

- ✅ **Smart Capture** - Pre and post-interaction screenshots with intelligent settling detection
- ✅ **Visual Markers** - Annotated click locations with customizable styles
- ✅ **Animated Output** - Export as GIF, APNG, or ZIP with configurable quality
- ✅ **Persistent Storage** - Save recordings to IndexedDB with full CRUD operations
- ✅ **Privacy Mode** - Built-in PII obfuscation with CSS class-based control (`pii-enable`/`pii-disable`)
- ✅ **Keyboard Shortcuts** - Fully configurable hotkeys for all actions
- ✅ **Metadata Export** - Comprehensive JSON metadata with DOM paths, coordinates, and scroll positions
- ✅ **Customizable UI** - Draggable, minimizable recorder interface with modern design
- ✅ **Inventory Management** - View, search, sort, and manage saved reels
- ✅ **Playback UI** - Frame-by-frame playback with metadata display
- ✅ **Settings Panel** - User preferences with logarithmic time controls and persistence

## Installation

```bash
npm install @owebeeone/click-reel
```

> **Note**: Library is under active development. Installation will be available after Phase 14 (npm publish).

## Quick Start

```tsx
import { ClickReelProvider, ClickReelRecorder, ClickReelInventory } from '@owebeeone/click-reel';

function App() {
  return (
    <ClickReelProvider>
      <YourApp />
      <ClickReelRecorder />
      {/* Optional: Add inventory viewer */}
      <ClickReelInventory />
    </ClickReelProvider>
  );
}
```

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

## Implementation Roadmap

See [CLICK-REEL-PLAN.md](./CLICK-REEL-PLAN.md) for the complete 14-phase implementation plan.

### Completed Phases

- ✅ **Phase 0** - Project Setup & Infrastructure
- ✅ **Phase 1** - Core Capture Engine (DOM-to-image, markers, scroll handling)
- ✅ **Phase 2** - Event Management (post-click scheduling, settled detection, keyboard shortcuts)
- ✅ **Phase 3** - Encoding Services (GIF, APNG, ZIP export)
- ✅ **Phase 4** - Storage System (IndexedDB with idb)
- ✅ **Phase 5** - Inventory Viewer (browse, search, sort saved reels)
- ✅ **Phase 6** - Export Functionality (download with progress indicators)
- ✅ **Phase 7** - Recorder UI (draggable, minimizable, visibility toggle)
- ✅ **Phase 8** - Playback UI (frame-by-frame viewer with metadata)
- ✅ **Phase 9** - Settings Panel (preferences, logarithmic sliders, persistence)
- ✅ **Phase 10** - HTML Obfuscation (PII protection with class-based control)

### Current Phase

- 🚧 **Phase 11** - Integration & Polish (error handling, loading states, UX refinements)

### Upcoming Phases

- 🔜 **Phase 12** - Documentation & Examples
- 🔜 **Phase 13** - Testing Suite (unit, integration, E2E)
- 🔜 **Phase 14** - npm Publication & Distribution

## Technology Stack

- **TypeScript 5.9** - Type-safe development
- **React 19** - UI components and hooks
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

- `<ClickReelProvider>` - Context provider for global state
- `<ClickReelRecorder>` - Main recorder UI with controls
- `<ClickReelInventory>` - Saved reels browser and manager
- `<SettingsPanel>` - User preferences configuration

### Hooks

- `useRecorder()` - Recording state and control functions
- `useStorage()` - IndexedDB operations (save, load, delete reels)
- `usePreferences()` - User settings with persistence
- `useKeyboardShortcuts()` - Configurable hotkey management

### Core Functions

- `captureFrame()` - Capture a screenshot with markers
- `exportReel()` - Export reel as GIF/APNG/ZIP
- `obfuscateInPlace()` - PII obfuscation for privacy

---

**Current Version:** 0.1.0 (Development)  
**Status:** Phase 11 - Integration & Polish 🚧  
**Last Updated:** October 4, 2025
