# click-reel

A browser-side interaction recorder that captures annotated screenshots of user interactions and assembles them into animated GIF/APNG files with metadata.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Status

🚧 **Phase 0 Complete** - Project infrastructure is set up and ready for core development.

See [PHASE_0_COMPLETE.md](./PHASE_0_COMPLETE.md) for full details.

## Features (Planned)

- 📸 **Smart Capture** - Pre and post-interaction screenshots with intelligent settling detection
- 🎯 **Visual Markers** - Annotated click locations with customizable styles
- 🎬 **Animated Output** - Export as GIF or APNG with configurable quality
- 💾 **Persistent Storage** - Save recordings to IndexedDB for later export
- 🔒 **Privacy Mode** - Built-in content obfuscation for sensitive data
- ⌨️ **Keyboard Shortcuts** - Configurable hotkeys for all actions
- 📦 **Metadata Export** - Comprehensive JSON metadata with DOM paths and coordinates
- 🎨 **Customizable UI** - Draggable recorder interface with modern design

## Installation

```bash
npm install click-reel
```

> **Note**: Library is under active development. Installation will be available after Phase 14 (npm publish).

## Quick Start

```tsx
import { ClickReelProvider, ClickReelRecorder } from 'click-reel';

function App() {
  return (
    <ClickReelProvider>
      <YourApp />
      <ClickReelRecorder />
    </ClickReelProvider>
  );
}
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

- ✅ **Phase 0** (Week 1) - Project Setup & Infrastructure

### Upcoming Phases

- 🔜 **Phase 1** (Week 2-3) - Core Capture Engine
- 🔜 **Phase 2** (Week 3-4) - Event Management System
- 🔜 **Phase 3** (Week 4-5) - Encoding Services

## Technology Stack

- **TypeScript** - Type-safe development
- **React** - UI components
- **html-to-image** - DOM rasterization
- **gifenc** - GIF encoding
- **upng-js** - APNG encoding
- **jszip** - Archive creation
- **idb** - IndexedDB wrapper
- **Vite** - Build tooling
- **Vitest** - Testing framework

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

---

**Current Version:** 0.0.1 (Development)  
**Status:** Phase 0 Complete ✅  
**Last Updated:** October 3, 2025
