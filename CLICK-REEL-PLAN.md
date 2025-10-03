# Click-Reel Implementation Plan

## Executive Summary

Click-Reel is a browser-side interaction recording library that captures annotated screenshots of user interactions and assembles them into animated GIF/APNG files with metadata. This document provides a comprehensive implementation plan with phased development, detailed technology analysis, and architectural decisions.

## Technology Stack Analysis

### 1. DOM Rasterization & Screenshot Capture

**Requirement**: Capture high-quality screenshots of DOM elements, with support for cloning and manipulation.

**Options Evaluated**:

| Package           | Version  | Pros                                                                                                                              | Cons                                                                         | Verdict         |
| ----------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------- |
| **html-to-image** | ^1.11.11 | ✅ Active maintenance<br>✅ Excellent browser support<br>✅ Simple API<br>✅ Good performance<br>✅ Support for data URLs & blobs | ⚠️ Cross-origin issues require CORS<br>⚠️ Shadow DOM limitations             | **RECOMMENDED** |
| html2canvas       | ^1.4.1   | ✅ Mature & widely used<br>✅ Good documentation                                                                                  | ❌ Slower performance<br>❌ Less accurate rendering<br>❌ Larger bundle size | Not selected    |
| dom-to-image      | ^2.6.0   | ✅ Pioneer in this space                                                                                                          | ❌ No longer maintained<br>❌ Known bugs                                     | Not selected    |
| modern-screenshot | ^4.4.39  | ✅ Very fast<br>✅ TypeScript support                                                                                             | ⚠️ Newer, less battle-tested                                                 | Backup option   |

**Decision**: Use **html-to-image** for its balance of performance, accuracy, and maintenance.

### 2. Animated Image Encoding

**Requirement**: Encode a sequence of PNG frames into animated GIF or APNG format on the client-side.

#### GIF Encoding

| Package          | Version | Pros                                                                                                                       | Cons                                             | Verdict         |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------- |
| **gifenc**       | ^1.0.3  | ✅ Modern, fast encoder<br>✅ Small bundle size (~3KB)<br>✅ Good quality<br>✅ TypeScript support<br>✅ Dithering support | ⚠️ Relatively new                                | **RECOMMENDED** |
| gif.js           | ^0.2.0  | ✅ Web Worker support<br>✅ Well established                                                                               | ❌ Large bundle<br>❌ Slower<br>❌ No TypeScript | Not selected    |
| @wasm-codecs/gif | Latest  | ✅ WASM performance                                                                                                        | ⚠️ More complex setup<br>⚠️ Larger bundle        | Overkill        |

#### APNG Encoding

| Package     | Version | Pros                                                                                              | Cons                                    | Verdict         |
| ----------- | ------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------- |
| **upng-js** | ^2.1.0  | ✅ Lossless format<br>✅ Better quality than GIF<br>✅ Smaller file size<br>✅ Full color support | ⚠️ Less browser support (but improving) | **RECOMMENDED** |
| apng-js     | ^1.1.1  | ✅ Pure JavaScript                                                                                | ❌ Older, less maintained               | Backup option   |

**Decision**: Support both formats:

- **gifenc** for GIF (wider compatibility, nostalgic appeal)
- **upng-js** for APNG (better quality, modern standard)

### 3. Archive Creation & File Bundling

**Requirement**: Package GIF/APNG and metadata JSON into a downloadable ZIP file.

| Package   | Version | Pros                                                                                                                   | Cons                                  | Verdict         |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------- |
| **jszip** | ^3.10.1 | ✅ Industry standard<br>✅ Excellent API<br>✅ Strong browser support<br>✅ TypeScript types<br>✅ Compression options | None significant                      | **RECOMMENDED** |
| fflate    | ^0.8.2  | ✅ Very fast<br>✅ Smaller bundle                                                                                      | ⚠️ Lower-level API<br>⚠️ More complex | Not needed      |

**Decision**: Use **jszip** for its mature API and excellent developer experience.

### 4. State Management & Persistence

**Requirement**: Manage recorder state and persist recordings across sessions.

#### State Management

| Approach                       | Pros                                                                                      | Cons                                                | Verdict         |
| ------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------- |
| **React Context + useReducer** | ✅ Built-in, no dependencies<br>✅ Predictable state updates<br>✅ Good for complex state | None for this use case                              | **RECOMMENDED** |
| Zustand                        | ✅ Simple API<br>✅ Less boilerplate                                                      | ⚠️ Additional dependency<br>⚠️ Overkill for library | Not needed      |
| Redux Toolkit                  | ✅ Powerful<br>✅ DevTools                                                                | ❌ Too heavy for a library                          | Not suitable    |

#### Persistence

| Package                     | Version                         | Pros                                                                                                                  | Cons                                                | Verdict         |
| --------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------- |
| **idb** (IndexedDB wrapper) | ^8.0.0                          | ✅ Async API<br>✅ Large storage capacity<br>✅ Can store Blobs directly<br>✅ TypeScript support<br>✅ Promise-based | ⚠️ Slightly complex API                             | **RECOMMENDED** |
| localforage                 | ^1.10.0                         | ✅ Simple API<br>✅ Automatic fallback                                                                                | ⚠️ Callback-based (older style)<br>⚠️ Less flexible | Backup option   |
| Native localStorage         | ✅ No dependencies<br>✅ Simple | ❌ Size limits (~5-10MB)<br>❌ Synchronous<br>❌ Can't store Blobs                                                    | Not suitable                                        |

**Decision**:

- **React Context + useReducer** for runtime state
- **idb** for IndexedDB persistence (handles large binary data well)

### 5. UI Components & Interaction

**Requirement**: Draggable floating recorder UI with icons and controls.

#### Drag & Drop

| Package           | Version            | Pros                                                                                                                      | Cons                                    | Verdict         |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------- |
| **@dnd-kit/core** | ^6.1.0             | ✅ Modern, performant<br>✅ Accessibility built-in<br>✅ TypeScript support<br>✅ Tree-shakeable<br>✅ Active development | ⚠️ More features than needed            | **RECOMMENDED** |
| react-draggable   | ^4.4.6             | ✅ Simple API<br>✅ Lightweight<br>✅ Well-established                                                                    | ⚠️ Less maintained<br>⚠️ Older patterns | Alternative     |
| Native Drag API   | ✅ No dependencies | ❌ Complex to implement<br>❌ Accessibility concerns                                                                      | Not practical                           |

#### Icons

| Package          | Version  | Pros                                                                                                                      | Cons                                       | Verdict         |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------- |
| **lucide-react** | ^0.453.0 | ✅ Beautiful, consistent<br>✅ Tree-shakeable<br>✅ Active development<br>✅ TypeScript support<br>✅ Small bundle impact | None                                       | **RECOMMENDED** |
| react-icons      | ^5.3.0   | ✅ Many icon sets                                                                                                         | ⚠️ Larger bundle<br>⚠️ Inconsistent styles | Not selected    |
| heroicons        | ^2.1.5   | ✅ Beautiful Tailwind design                                                                                              | ⚠️ Fewer icons                             | Alternative     |

#### Keyboard Shortcuts

| Package                | Version | Pros                                                                                                    | Cons                                        | Verdict         |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------- |
| **react-hotkeys-hook** | ^4.5.1  | ✅ Simple React hooks API<br>✅ TypeScript support<br>✅ Good documentation<br>✅ Handles focus context | None                                        | **RECOMMENDED** |
| mousetrap              | ^1.6.5  | ✅ Popular                                                                                              | ⚠️ Not React-specific<br>⚠️ Less modern API | Not selected    |

**Decision**:

- **@dnd-kit/core** for draggable UI
- **lucide-react** for icons
- **react-hotkeys-hook** for keyboard shortcuts

### 6. Image Processing & Comparison

**Requirement**: Compare images to detect when animations have settled.

| Approach                     | Pros                                                           | Cons                                                 | Verdict         |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- | --------------- |
| **Base64 string comparison** | ✅ Fast<br>✅ No dependencies<br>✅ Sufficient for exact match | ⚠️ Can't detect "similar" images                     | **RECOMMENDED** |
| pixelmatch                   | ✅ Perceptual comparison<br>✅ Configurable threshold          | ⚠️ Additional dependency<br>⚠️ Overkill for this use | Not needed      |
| Custom hash comparison       | ✅ Very fast                                                   | ⚠️ Complex to implement well                         | Not needed      |

**Decision**: Use **Base64 string comparison** as specified in the spec - simple and effective.

### 7. Build & Development Tools

| Tool                     | Version | Purpose                        | Verdict      |
| ------------------------ | ------- | ------------------------------ | ------------ |
| **TypeScript**           | ^5.6.0  | Type safety, better DX         | **REQUIRED** |
| **Vite**                 | ^7.1.7  | Fast builds, HMR, library mode | **CURRENT**  |
| **Vitest**               | ^3.2.4  | Testing framework              | **CURRENT**  |
| **@vitejs/plugin-react** | ^4.2.1  | React support                  | **CURRENT**  |

**Decision**: Keep current setup, add TypeScript dependencies.

### 8. Additional Utilities

| Package      | Version | Purpose                              | Verdict         |
| ------------ | ------- | ------------------------------------ | --------------- |
| **nanoid**   | ^5.0.9  | Generate unique IDs for frames/reels | **RECOMMENDED** |
| **date-fns** | ^4.1.0  | Format timestamps in metadata        | **RECOMMENDED** |
| **clsx**     | ^2.1.1  | Conditional className composition    | **RECOMMENDED** |

---

## Complete Dependency List

### Production Dependencies

```json
{
  "dependencies": {
    "html-to-image": "^1.11.11",
    "gifenc": "^1.0.3",
    "upng-js": "^2.1.0",
    "jszip": "^3.10.1",
    "idb": "^8.0.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/utilities": "^3.2.2",
    "lucide-react": "^0.453.0",
    "react-hotkeys-hook": "^4.5.1",
    "nanoid": "^5.0.9",
    "date-fns": "^4.1.0",
    "clsx": "^2.1.1"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.6.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "vite": "^7.1.7",
    "vitest": "^3.2.4",
    "jsdom": "^24.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.5.0"
  }
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User Application                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │              <ClickReelProvider>                   │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │         <ClickReelRecorder>                  │  │  │
│  │  │    (Floating UI, Event Listeners)            │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │          <ClickReelInventory>                │  │  │
│  │  │    (View & Download Recordings)              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Core State (Context)                   │
│  • Recorder state (idle/armed/recording/processing)      │
│  • Current reel (frames, metadata, settings)             │
│  • Reels inventory (list of saved recordings)            │
│  • User preferences (marker size, format, delays)        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      Core Modules                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Capture   │  │  Encoder   │  │ Metadata   │        │
│  │  Engine    │  │  Service   │  │ Collector  │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Event    │  │  Storage   │  │   Export   │        │
│  │  Manager   │  │  Service   │  │  Service   │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   External Libraries                     │
│  html-to-image │ gifenc │ upng-js │ jszip │ idb         │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure (Updated)

```
click-reel/
├── src/
│   ├── index.ts                    # Main library entry point
│   │
│   ├── core/                       # Core business logic (framework-agnostic)
│   │   ├── capture.ts              # DOM cloning, marker injection, rasterization
│   │   ├── encoder.ts              # GIF/APNG encoding orchestration
│   │   ├── metadata.ts             # Metadata collection & element path generation
│   │   ├── storage.ts              # IndexedDB operations via idb
│   │   ├── export.ts               # ZIP bundling and download
│   │   └── events.ts               # Event listener management
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── index.ts                # Central export
│   │   ├── reel.ts                 # Reel, Frame, ReelMetadata types
│   │   ├── config.ts               # Configuration & options types
│   │   └── state.ts                # State management types
│   │
│   ├── utils/                      # Helper utilities
│   │   ├── dom-utils.ts            # Element path, selector utilities
│   │   ├── image-utils.ts          # Image comparison, format conversion
│   │   ├── keyboard-utils.ts       # Keyboard shortcut helpers
│   │   └── constants.ts            # Default values, constants
│   │
│   ├── react/                      # React-specific implementation
│   │   ├── index.ts                # React exports
│   │   ├── ClickReelProvider.tsx   # Context provider for state management
│   │   ├── ClickReelRecorder.tsx   # Main recorder component
│   │   ├── ClickReelInventory.tsx  # Inventory viewer component
│   │   ├── ClickReelSettings.tsx   # User preferences component
│   │   │
│   │   ├── components/             # Sub-components
│   │   │   ├── RecorderUI.tsx      # Floating recorder controls
│   │   │   ├── RecorderStatus.tsx  # Status indicator
│   │   │   ├── InventoryList.tsx   # List of saved reels
│   │   │   ├── InventoryItem.tsx   # Single reel item
│   │   │   ├── ReelPlayer.tsx      # Preview player for GIF/APNG
│   │   │   └── SettingsPanel.tsx   # Settings form
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useRecorder.ts      # Main recorder logic hook
│   │   │   ├── useStorage.ts       # IndexedDB operations hook
│   │   │   ├── useKeyboardShortcuts.ts # Hotkey management
│   │   │   └── useClickCapture.ts  # Pointer event handling
│   │   │
│   │   └── context/                # React Context
│   │       ├── ClickReelContext.tsx # Context definition
│   │       └── actions.ts          # Action creators for reducer
│   │
│   ├── styles/                     # Component styles (optional)
│   │   └── recorder.css            # Base styles for recorder UI
│   │
│   └── __tests__/                  # Test files
│       ├── core/                   # Core logic tests
│       ├── utils/                  # Utility tests
│       └── react/                  # React component tests
│
├── demo/                           # Development playground
│   ├── App.tsx                     # Demo application
│   ├── main.tsx                    # Demo entry point
│   └── index.html                  # Demo HTML
│
├── dist/                           # Build output
├── docs/                           # Documentation
│   ├── API.md                      # API documentation
│   ├── EXAMPLES.md                 # Usage examples
│   └── TROUBLESHOOTING.md          # Common issues
│
├── CLICK-REEL-SPEC.md              # Original specification
├── CLICK-REEL-PLAN.md              # This file
├── README.md                       # Public readme
├── package.json                    # Package manifest
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite build config
└── vitest.config.ts                # Test config
```

---

## Implementation Phases

### Phase 0: Project Setup & Infrastructure (Week 1)

**Goal**: Establish solid foundation with TypeScript, testing, and development environment.

**Tasks**:

- [ ] Migrate to TypeScript (convert existing JSX to TSX)
- [ ] Install all production and dev dependencies
- [ ] Configure TypeScript for strict mode
- [ ] Set up Vitest with React Testing Library
- [ ] Create initial type definitions in `src/types/`
- [ ] Set up proper Vite library build configuration
- [ ] Create demo playground in `demo/` directory
- [ ] Establish code style guidelines (ESLint + Prettier)

**Deliverables**:

- ✅ Fully typed project skeleton
- ✅ Working test infrastructure
- ✅ Demo environment for rapid iteration
- ✅ Build pipeline for library distribution

**Success Criteria**:

- `npm run build` produces valid ESM and UMD bundles
- `npm test` runs successfully
- `npm run dev` launches demo playground
- No TypeScript errors

---

### Phase 1: Core Capture Engine (Week 2-3)

**Goal**: Implement the fundamental screenshot capture mechanism with marker injection.

**Focus**: `src/core/capture.ts` + `src/utils/dom-utils.ts`

**Tasks**:

- [ ] Implement DOM cloning function using `html-to-image`
- [ ] Create marker injection logic (SVG or styled div)
  - Support different pointer button types (left/right/middle click)
  - Configurable marker styles (size, color, opacity)
- [ ] Develop robust element path generation
  - Priority: `data-testid` → `id` → CSS path with nth-child
- [ ] Handle `data-screenshot-exclude` attribute
- [ ] Implement coordinate calculation (viewport + relative to root)
- [ ] Add error handling for cross-origin content
- [ ] Create image data extraction utilities
- [ ] Write comprehensive unit tests

**Key Functions**:

```typescript
async function captureFrame(
  root: HTMLElement,
  pointerEvent: PointerEvent,
  options: CaptureOptions
): Promise<Frame>;

function createMarkerElement(
  coords: { x: number; y: number },
  buttonType: number,
  style: MarkerStyle
): HTMLElement;

function getElementPath(element: HTMLElement, root: HTMLElement): string;
```

**Deliverables**:

- ✅ Working capture engine that produces PNG frames with markers
- ✅ Utility functions for DOM manipulation
- ✅ Test coverage >80%

**Success Criteria**:

- Can capture a frame with a marker at precise coordinates
- Marker correctly reflects pointer button type
- Element paths are accurate and reproducible
- Handles edge cases (scrolled content, excluded elements)

---

### Phase 2: Event Management System (Week 3-4)

**Goal**: Build the event listening and timing logic for pre/post-click capture.

**Focus**: `src/core/events.ts` + `src/utils/keyboard-utils.ts`

**Tasks**:

- [ ] Implement capturing-phase `pointerdown` listener
- [ ] Add optional `pointerup` listener
- [ ] Create "armed mode" logic (capture only next click)
- [ ] Implement post-click frame scheduling
  - Initial delay (default 500ms)
  - Subsequent intervals (default 100ms)
  - Maximum duration timeout (default 4000ms)
- [ ] Add image comparison logic (Base64 string comparison)
- [ ] Implement "settled" detection (two consecutive identical frames)
- [ ] Create scope verification (clicks within root element only)
- [ ] Handle page navigation/unload (terminate session)
- [ ] Implement keyboard shortcut system
  - `Ctrl+Shift+R` - Toggle recorder UI
  - `Ctrl+Shift+O` - Toggle obfuscation
  - Configurable custom shortcuts
- [ ] Write integration tests for event flow

**Key Functions**:

```typescript
class EventManager {
  arm(root: HTMLElement): void;
  disarm(): void;
  onCapture(callback: (frame: Frame) => void): void;
  schedulePostClickCaptures(initialEvent: PointerEvent): Promise<Frame[]>;
}
```

**Deliverables**:

- ✅ Complete event management system
- ✅ Working post-click capture heuristic
- ✅ Keyboard shortcut infrastructure

**Success Criteria**:

- Events fire at correct phases (capture phase for pre-click)
- Post-click captures occur at specified intervals
- Capture stops when animation settles or timeout reached
- Keyboard shortcuts work reliably across different browsers

---

### Phase 3: Encoding Services (Week 4-5)

**Goal**: Implement GIF and APNG encoding from frame sequences.

**Focus**: `src/core/encoder.ts` + `src/utils/image-utils.ts`

**Tasks**:

- [ ] Implement GIF encoding using `gifenc`
  - Configure palette generation
  - Add dithering options (ordered, floyd-steinberg, none)
  - Set frame delays based on timestamp differences
  - Optimize for quality vs. file size
- [ ] Implement APNG encoding using `upng-js`
  - Configure compression levels
  - Handle frame delays
  - Optimize for quality
- [ ] Create image scaling/resizing logic
  - Respect `maxWidth` and `maxHeight` constraints
  - Maintain aspect ratio
- [ ] Add format conversion utilities (PNG → ImageData → encoded format)
- [ ] Implement progress reporting during encoding
- [ ] Add file size estimation
- [ ] Write performance benchmarks
- [ ] Test with various frame counts and resolutions

**Key Functions**:

```typescript
async function encodeGIF(frames: Frame[], options: GIFOptions): Promise<Blob>;

async function encodeAPNG(frames: Frame[], options: APNGOptions): Promise<Blob>;

function estimateOutputSize(frames: Frame[], format: "gif" | "apng"): number;
```

**Deliverables**:

- ✅ Working GIF encoder
- ✅ Working APNG encoder
- ✅ Configurable quality settings
- ✅ Performance optimizations

**Success Criteria**:

- Produces valid GIF/APNG files that play correctly
- Frame delays accurately reflect capture timing
- Output size is reasonable (<10MB for typical recordings)
- Encoding completes in <10 seconds for 50 frames

---

### Phase 4: Storage & Persistence (Week 5-6)

**Goal**: Implement IndexedDB storage for saving reels across sessions.

**Focus**: `src/core/storage.ts`

**Tasks**:

- [ ] Design IndexedDB schema
  - `reels` object store (id, title, description, timestamp, settings)
  - `frames` object store (id, reelId, image blob, metadata, order)
- [ ] Implement database initialization
- [ ] Create CRUD operations for reels
  - Save new reel
  - Load reel by ID
  - Load all reels (inventory)
  - Update reel metadata
  - Delete reel (cascade delete frames)
- [ ] Implement frame operations
  - Save frames in chunks (handle large recordings)
  - Load frames for a reel
  - Delete frames by reel ID
- [ ] Add storage quota management
  - Check available storage
  - Warn user if quota is low
  - Implement cleanup strategy (FIFO or user-selected)
- [ ] Handle storage errors gracefully
- [ ] Write integration tests with in-memory IndexedDB

**Key Functions**:

```typescript
class StorageService {
  async saveReel(reel: Reel): Promise<string>;
  async loadReel(id: string): Promise<Reel | null>;
  async loadAllReels(): Promise<ReelSummary[]>;
  async deleteReel(id: string): Promise<void>;
  async getStorageInfo(): Promise<StorageInfo>;
}
```

**Deliverables**:

- ✅ Complete IndexedDB storage implementation
- ✅ Efficient handling of large binary data
- ✅ Quota management system

**Success Criteria**:

- Can save and retrieve reels reliably
- Handles recordings with 100+ frames without issues
- Storage quota is managed properly
- Works offline and persists across sessions

---

### Phase 5: Export & Download (Week 6)

**Goal**: Package recordings into downloadable formats.

**Focus**: `src/core/export.ts`

**Tasks**:

- [ ] Implement ZIP bundling using `jszip`
  - Add GIF/APNG file
  - Add metadata JSON file
  - Add optional HTML snapshot
  - Generate human-readable filenames
- [ ] Create download trigger
  - Use Blob URLs and anchor element
  - Clean up object URLs after download
- [ ] Implement format options
  - GIF only
  - APNG only
  - Full ZIP bundle
- [ ] Add metadata generation
  - Frame timestamps
  - Click coordinates
  - Element paths
  - Viewport dimensions
  - Scroll positions
  - Optional sanitized HTML
- [ ] Write export utilities
- [ ] Test across browsers (Chrome, Firefox, Safari, Edge)

**Key Functions**:

```typescript
async function exportAsZip(reel: Reel): Promise<Blob>;
async function exportAsGIF(reel: Reel): Promise<Blob>;
async function exportAsAPNG(reel: Reel): Promise<Blob>;
function generateMetadata(reel: Reel): ReelMetadata;
function downloadFile(blob: Blob, filename: string): void;
```

**Deliverables**:

- ✅ Complete export system
- ✅ Multiple export format options
- ✅ Metadata generation

**Success Criteria**:

- ZIP files contain all expected files
- Filenames are descriptive and timestamped
- Downloads trigger correctly in all major browsers
- Metadata is complete and accurate

---

### Phase 6: React Context & State Management (Week 7)

**Goal**: Build the React state management layer.

**Focus**: `src/react/context/` + `src/react/hooks/`

**Tasks**:

- [ ] Design state shape
  - Recorder state (idle, armed, recording, processing, exporting)
  - Current reel data
  - User preferences
  - Inventory cache
- [ ] Implement reducer with actions
  - START_RECORDING, ARM, DISARM
  - ADD_FRAME, COMPLETE_RECORDING
  - LOAD_INVENTORY, SELECT_REEL
  - UPDATE_PREFERENCES
  - SET_ERROR, CLEAR_ERROR
- [ ] Create ClickReelProvider component
- [ ] Implement useRecorder hook
  - Orchestrates capture, encoding, storage
  - Manages lifecycle of a recording session
  - Exposes API: `{ start, stop, arm, addFrame, export }`
- [ ] Implement useStorage hook
  - Wraps StorageService in React hook
  - Returns loading/error states
- [ ] Implement useClickCapture hook
  - Manages event listeners
  - Handles armed mode
- [ ] Implement useKeyboardShortcuts hook
  - Registers/unregisters shortcuts
  - Respects input focus context
- [ ] Write React hook tests

**Key Hooks**:

```typescript
function useRecorder(): RecorderAPI;
function useStorage(): StorageAPI;
function useClickCapture(root: HTMLElement, armed: boolean): void;
function useKeyboardShortcuts(shortcuts: Shortcuts): void;
```

**Deliverables**:

- ✅ Complete React state management
- ✅ Custom hooks for all core functionality
- ✅ Context provider

**Success Criteria**:

- State updates are predictable and debuggable
- Hooks are reusable and composable
- No memory leaks from event listeners
- Works correctly with React Strict Mode

---

### Phase 7: Recorder UI Components (Week 8-9)

**Goal**: Build the floating recorder interface.

**Focus**: `src/react/components/RecorderUI.tsx` and related components

**Tasks**:

- [ ] Design component hierarchy
- [ ] Implement RecorderUI (main floating component)
  - Use `@dnd-kit/core` for draggable behavior
  - Show recorder status (idle/armed/recording/processing)
  - Display frame count and estimated size
  - Provide control buttons
- [ ] Create control buttons using `lucide-react` icons
  - Record/Arm button
  - Stop button
  - Add frame manually button
  - Settings button
  - Close/minimize button
- [ ] Implement RecorderStatus indicator
  - Visual status (color-coded dot)
  - Status text
  - Progress bar during encoding
- [ ] Design responsive layout
  - Collapsible/expandable
  - Mobile-friendly (but primarily desktop)
  - Dark mode support
- [ ] Add animations and transitions
  - Smooth state transitions
  - Button hover effects
  - Pulsing animation when armed
- [ ] Ensure accessibility
  - ARIA labels
  - Keyboard navigation
  - Focus management
- [ ] Write component tests with React Testing Library

**Deliverables**:

- ✅ Complete floating recorder UI
- ✅ Accessible and keyboard-friendly
- ✅ Responsive design

**Success Criteria**:

- UI is draggable and stays within viewport bounds
- All buttons work correctly
- Status updates are immediate and clear
- Passes accessibility audit (axe-core)

---

### Phase 8: Inventory & Playback UI (Week 9-10)

**Goal**: Build the inventory viewer and playback components.

**Focus**: `src/react/components/Inventory*.tsx` + `ReelPlayer.tsx`

**Tasks**:

- [x] Implement InventoryList component
  - Display list of saved reels
  - Show thumbnails (first frame)
  - Display title, description, timestamp, frame count
  - Sort options (date, title, duration)
  - Search/filter functionality
- [x] Implement InventoryItem component
  - Thumbnail preview
  - Metadata display
  - Action buttons (play, download, delete)
  - Edit title/description inline
- [x] Implement ReelPlayer component
  - Display GIF/APNG in modal or dedicated view
  - Playback controls (play/pause if possible with canvas)
  - Frame-by-frame navigation
  - Metadata viewer (show click coordinates, element paths)
- [x] Create download UI
  - Format selection (GIF, APNG, ZIP)
  - Progress indicator (integrated with export buttons)
- [x] Implement delete confirmation
  - Modal dialog
  - Cascade delete warning
- [x] Add empty state UI
  - Onboarding message
  - Getting started guide
- [ ] Write component tests

**Deliverables**:

- ✅ Complete inventory management UI
- ✅ Playback and preview functionality
- ✅ Export options UI

**Success Criteria**:

- Can view all saved reels
- Playback is smooth and reliable
- Can download in multiple formats
- Delete requires confirmation

---

### Phase 9: Settings & Preferences (Week 10)

**Goal**: Implement user preferences and configuration UI.

**Focus**: `src/react/components/SettingsPanel.tsx`

**Tasks**:

- [ ] Design preferences schema
  - Marker size (px)
  - Marker color
  - Preferred export format (GIF/APNG)
  - Post-click delay (ms)
  - Post-click interval (ms)
  - Maximum capture duration (ms)
  - Scale factor
  - Max dimensions
  - Obfuscation enabled/disabled
  - Keyboard shortcuts (customizable)
- [ ] Implement SettingsPanel component
  - Form inputs for each preference
  - Live preview of marker
  - Reset to defaults button
  - Save button (persist to localStorage or IndexedDB)
- [ ] Add preference persistence
  - Load on mount
  - Save on change
- [ ] Create configuration validation
  - Min/max ranges
  - Sensible defaults
- [ ] Add tooltips and help text
  - Explain each setting
  - Provide recommendations
- [ ] Write component tests

**Deliverables**:

- ✅ Complete settings UI
- ✅ Preference persistence
- ✅ Validation and defaults

**Success Criteria**:

- Settings persist across sessions
- Invalid inputs are rejected with helpful messages
- Preview accurately reflects settings
- Changing settings immediately affects new recordings

---

### Phase 10: HTML Obfuscation & Privacy (Week 11)

**Goal**: Implement content obfuscation for user privacy.

**Focus**: `src/utils/obfuscation.ts`

**Tasks**:

- [ ] Design obfuscation strategy
  - Identify user-content elements (inputs, text content, images)
  - Preserve structural elements
  - Maintain visual layout
- [ ] Implement obfuscation algorithm
  - Replace text with placeholder characters (preserve length)
  - Replace images with solid color blocks
  - Clear form input values
  - Randomize data-\* attributes
  - Preserve element types and structure
- [ ] Add selective obfuscation
  - Respect `data-screenshot-preserve` attribute
  - Configurable element selector patterns
- [ ] Implement keyboard toggle (`Ctrl+Shift+O`)
- [ ] Add visual indicator when obfuscation is active
- [ ] Test obfuscation on various DOM structures
- [ ] Document privacy implications

**Key Functions**:

```typescript
function obfuscateDOM(
  element: HTMLElement,
  config: ObfuscationConfig
): HTMLElement;
function shouldObfuscate(element: HTMLElement): boolean;
function replaceText(text: string): string;
```

**Deliverables**:

- ✅ Working obfuscation system
- ✅ Keyboard toggle
- ✅ Configurable rules

**Success Criteria**:

- User content is effectively masked
- Page structure remains intact
- Toggle works reliably
- Does not significantly impact capture performance

---

### Phase 11: Integration & Polish (Week 12)

**Goal**: Integrate all components and add final polish.

**Tasks**:

- [ ] Integrate all phases into cohesive library
- [ ] Test complete user flows end-to-end
  - Start recording → capture clicks → view inventory → download
- [ ] Performance optimization
  - Lazy load heavy dependencies
  - Optimize encoding for large frame counts
  - Reduce memory footprint
- [ ] Error handling refinement
  - User-friendly error messages
  - Graceful degradation
  - Sentry integration (optional)
- [ ] Add loading states and skeletons
- [ ] Implement telemetry (opt-in, anonymized)
  - Track usage patterns
  - Identify performance bottlenecks
- [ ] Polish animations and transitions
- [ ] Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers (limited support)
- [ ] Accessibility audit and fixes
- [ ] Write comprehensive integration tests

**Deliverables**:

- ✅ Production-ready library
- ✅ Cross-browser compatibility
- ✅ Comprehensive test coverage

**Success Criteria**:

- All features work together seamlessly
- No critical bugs
- Performance is acceptable (encoding <10s for typical recording)
- Passes accessibility standards (WCAG 2.1 AA)

---

### Phase 12: Documentation & Examples (Week 13)

**Goal**: Create excellent developer experience with documentation.

**Tasks**:

- [ ] Write comprehensive README
  - Installation
  - Quick start
  - Basic usage
  - Configuration options
- [ ] Create API documentation
  - Component props
  - Hook signatures
  - Core API functions
  - Type definitions
- [ ] Write usage examples
  - Basic integration
  - Custom styling
  - Advanced configuration
  - Framework integration (Next.js, Remix, etc.)
- [ ] Create troubleshooting guide
  - Common issues
  - Browser compatibility
  - Performance optimization
  - Debugging tips
- [ ] Build demo applications
  - Simple demo (already exists)
  - Advanced demo with all features
  - Real-world integration example
- [ ] Create video tutorial (optional)
- [ ] Set up documentation site (e.g., with VitePress or Docusaurus)
- [ ] Write changelog

**Deliverables**:

- ✅ Complete documentation
- ✅ Multiple working examples
- ✅ Troubleshooting guide

**Success Criteria**:

- Developer can integrate library in <30 minutes
- All common questions are answered in docs
- Examples cover 80% of use cases
- API documentation is accurate and complete

---

### Phase 13: Testing & Quality Assurance (Week 14)

**Goal**: Achieve high test coverage and quality standards.

**Tasks**:

- [ ] Increase test coverage to >90%
  - Unit tests for all core modules
  - Integration tests for workflows
  - Component tests for React UI
- [ ] Add visual regression tests (optional)
  - Capture reference screenshots
  - Detect unintended UI changes
- [ ] Performance testing
  - Benchmark encoding times
  - Memory leak detection
  - Stress test with large recordings
- [ ] Security audit
  - Dependency vulnerability scan
  - XSS prevention in HTML sanitization
  - Review data handling practices
- [ ] Usability testing
  - User interviews/feedback
  - Identify UX friction
- [ ] Bug fixing sprint
  - Address all known issues
  - Prioritize by severity
- [ ] Code quality improvements
  - Refactor complex functions
  - Reduce code duplication
  - Improve naming and comments

**Deliverables**:

- ✅ High test coverage (>90%)
- ✅ Performance benchmarks
- ✅ Security audit report
- ✅ Bug-free stable release

**Success Criteria**:

- All tests pass consistently
- No known critical bugs
- Performance meets targets
- No security vulnerabilities

---

### Phase 14: Package & Distribution (Week 14)

**Goal**: Prepare library for public distribution.

**Tasks**:

- [ ] Finalize package.json
  - Set correct version (1.0.0)
  - Add keywords for discoverability
  - Ensure all metadata is correct
  - Configure peer dependencies correctly
- [ ] Set up npm publishing workflow
  - Create npm account/organization
  - Configure GitHub Actions for CI/CD
  - Automate version bumping and changelog
- [ ] Bundle optimization
  - Tree-shaking verification
  - Bundle size analysis
  - Code splitting for optional features
- [ ] Create GitHub repository
  - Add LICENSE file
  - Add CONTRIBUTING.md
  - Add issue templates
  - Add pull request template
  - Enable GitHub Discussions
- [ ] Set up semantic versioning
  - Use conventional commits
  - Automate changelog generation
- [ ] Create release notes
- [ ] Publish v1.0.0 to npm
- [ ] Announce release
  - Dev.to article
  - Reddit (r/reactjs, r/webdev)
  - Twitter/X
  - Product Hunt (optional)

**Deliverables**:

- ✅ Published npm package
- ✅ Public GitHub repository
- ✅ Release announcement

**Success Criteria**:

- Package installs correctly via npm
- Bundle size is reasonable (<100KB gzipped for core)
- GitHub repo has all necessary files
- Release is publicized

---

## Milestones & Timeline

| Milestone              | Phases | Duration   | Deliverable                                 |
| ---------------------- | ------ | ---------- | ------------------------------------------- |
| **M1: Foundation**     | 0      | Week 1     | TypeScript project setup, build pipeline    |
| **M2: Core Engine**    | 1-2    | Weeks 2-4  | Working capture and event system            |
| **M3: Encoding**       | 3      | Weeks 4-5  | GIF/APNG generation                         |
| **M4: Persistence**    | 4-5    | Weeks 5-6  | Storage and export                          |
| **M5: React Layer**    | 6      | Week 7     | State management and hooks                  |
| **M6: User Interface** | 7-9    | Weeks 8-10 | Complete UI (recorder, inventory, settings) |
| **M7: Privacy**        | 10     | Week 11    | Obfuscation feature                         |
| **M8: Integration**    | 11     | Week 12    | End-to-end working library                  |
| **M9: Documentation**  | 12     | Week 13    | Complete docs and examples                  |
| **M10: Release**       | 13-14  | Week 14    | Quality assurance and npm publish           |

**Total Estimated Time**: ~14 weeks (3.5 months) for a single developer working full-time.

---

## Risk Analysis & Mitigation

| Risk                                              | Probability | Impact | Mitigation                                              |
| ------------------------------------------------- | ----------- | ------ | ------------------------------------------------------- |
| **Browser compatibility issues**                  | High        | Medium | Extensive cross-browser testing, polyfills where needed |
| **Performance degradation with large recordings** | Medium      | High   | Implement frame limits, optimize encoding, add warnings |
| **IndexedDB quota exceeded**                      | Medium      | Medium | Quota management, user warnings, cleanup strategies     |
| **Cross-origin content rendering issues**         | High        | Low    | Clear documentation, CORS guidance, graceful fallback   |
| **Memory leaks from event listeners**             | Medium      | High   | Careful cleanup in useEffect, thorough testing          |
| **Bundle size bloat**                             | Low         | Medium | Tree-shaking, code splitting, bundle analysis           |
| **Accessibility shortcomings**                    | Medium      | Medium | Regular audits with axe-core, keyboard testing          |
| **User confusion with UI**                        | Medium      | Medium | Usability testing, clear onboarding, good docs          |

---

## Success Metrics

### Technical Metrics

- **Test Coverage**: >90%
- **Bundle Size**: <100KB gzipped (core), <250KB total (with UI)
- **Encoding Performance**: <10s for 50 frames at 1920x1080
- **Lighthouse Accessibility Score**: >95
- **Zero Known Critical Bugs**: At release

### Adoption Metrics (Post-Launch)

- **npm Downloads**: 1,000+ in first month
- **GitHub Stars**: 100+ in first month
- **Documentation Engagement**: 5,000+ page views
- **Community Contributions**: 5+ issues/PRs from external contributors

---

## Future Enhancements (Post-V1)

### V1.1 - Enhanced Capture

- [ ] Real-pixel mode using `getDisplayMedia` API
- [ ] Custom annotations (arrows, text, shapes)
- [ ] Multiple marker styles (ripple effect, crosshair, etc.)

### V1.2 - Advanced Editing

- [ ] Frame editing (delete, reorder, duplicate)
- [ ] Trim recordings
- [ ] Merge multiple reels
- [ ] Add text overlays and annotations post-capture

### V1.3 - Collaboration Features

- [ ] Share recordings via URL
- [ ] Cloud storage integration (S3, Google Drive)
- [ ] Embed recordings in iframe
- [ ] Generate shareable HTML page with playback

### V1.4 - Analytics & Insights

- [ ] Heatmap generation from multiple recordings
- [ ] User flow visualization
- [ ] Integration with analytics platforms (Mixpanel, Amplitude)

### V2.0 - Video Recording

- [ ] MP4/WebM video export (via MediaRecorder API)
- [ ] Audio commentary
- [ ] Screen + webcam recording
- [ ] Live streaming support

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building the click-reel library. The phased approach ensures steady progress while maintaining code quality. The technology choices are based on careful analysis of available npm packages, prioritizing:

1. **Performance**: Fast capture and encoding
2. **Developer Experience**: Great TypeScript support and API design
3. **Reliability**: Battle-tested, actively maintained dependencies
4. **Bundle Size**: Lean core with optional features
5. **Accessibility**: WCAG compliance and keyboard support

By following this plan, we will deliver a production-ready, well-documented, and user-friendly library for capturing and sharing UI interactions.

---

**Last Updated**: October 3, 2025  
**Version**: 1.0  
**Status**: Ready for Implementation
