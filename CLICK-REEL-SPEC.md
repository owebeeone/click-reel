# V0.3 click-reel Specification

This document outlines the scope, mechanics, and configuration for the `click-reel` library.

### What it is

A browser-side “interaction recorder” that captures a sequence of annotated screenshots (pre- and post-interaction) and assembles them into an animated GIF, plus an optional metadata bundle (HTML snapshot, click coordinates, timings).

### Capture mechanism

* **DOM Rasterization**: Uses `html-to-image` on a chosen root element (default: app container). This clones the DOM synchronously at call time, so calling from a capturing-phase event listener yields a true “pre‑propagation” visual state.

* **Real-Pixel Mode (Future)**: An optional mode using canvas drawing from a live `getDisplayMedia` stream. This requires user permission and is less ergonomic, so v1 will default to DOM rasterization.

### Event timing and annotation

* Install `pointerdown` (and optionally `pointerup`) listeners on the document with `{ capture: true }`.

* On `pointerdown`:

  * Record pointer coordinates (viewport and relative-to-root).

  * Build a cloned DOM subtree and inject a transient **“tap marker”** into the clone (not the live DOM) at the recorded coordinates.

  * Render the clone to a PNG image (this is the **pre-click frame**).

  * Schedule one or more **post-click frames** to capture visual changes after the event propagates.

* The original event is not blocked and continues propagation.

### Outputs

* **Frames**: A sequence of PNG images (or ImageData objects) with associated timestamps and the device's pixel ratio.

* **GIF**: Assembled on the client-side using a palette-based encoder (e.g., `gifenc`). The output is configurable for FPS, dithering, and max dimensions.

* **Metadata Sidecar (JSON)**: A JSON object containing:

  * Click points (viewport and relative coordinates).

  * The target element selector.

  * Viewport size and scroll position.

  * An optional sanitized `outerHTML` of the captured root element.

* An option will be provided to export all outputs as a single ZIP bundle.

### Controls and UX

* A minimal, floating recorder UI with controls for toggling capture mode, manually adding a frame, and finishing/exporting the recording.

* Elements can be excluded from capture by adding a `data-screenshot-exclude` attribute.

* Keyboard shortcuts will be available for starting/stopping, adding a frame, and marking a step.

* The UI will show progress and an estimated output size, with fallbacks if the Clipboard API is unavailable.

### Interaction Flow

* **Initiating a Session**: The recorder UI is toggled by a global hotkey (e.g., `Ctrl+Shift+R`). It is hidden by default to keep the application view clean.

* **Capture Mode**: To give the user precise control, the recorder operates in an "armed" mode. The user clicks a "Record Next Click" button in the UI, and only the *next* `pointerdown` event within the `root` will trigger the full pre- and post-click snapshot sequence.

* **Capture Scope**: The global `pointerdown` listener will verify that the event target is within the configured `root` element. Clicks occurring outside this scope will be ignored.

* **Page Navigation**: If the user navigates to a new URL or reloads the page while a recording session is active, the session will be automatically terminated, and any captured frames will be discarded.

### Configuration (per recorder instance)

* `root: HTMLElement`: The DOM element to capture.

* `scale: number`: The resolution scale (default: `2`).

* `maxWidth/maxHeight: number`: Maximum dimensions for the output GIF.

* `excludeSelector: string`: A CSS selector for elements to exclude.

* `markerStyle: object`: CSS styles for the tap marker.

* `postDelays: number[]`: An array of millisecond delays for post-click frames.

* `gifOptions: object`: Configuration for the GIF encoder (fps, quality, dithering).

* `collectHtml: boolean`: Whether to include the `outerHTML` in the metadata.

### Known constraints

* Cross-origin images and iframes require `useCORS` and proper server headers; they may otherwise render as blank areas.

* Capturing complex pages may require reducing the `scale` or the number of post-click frames to manage memory and performance.

* The library will intentionally avoid re-dispatching trusted events. It relies on DOM cloning to snapshot pre-propagation state without blocking the original event.

* **Shadow DOM**: Content encapsulated within a Shadow DOM (common in Web Components) may not be fully captured by the rasterization library.

* **Tainted Canvases**: A `<canvas>` element that has been drawn with cross-origin images will be treated as "tainted" by the browser and will appear blank in screenshots.

***

## Implementation Proposals

### Proposed Project Structure

To ensure the library is maintainable, testable, and scalable, a modular structure is proposed. Logic will be separated by concern.

```
src/
├── core/
│   ├── capture.ts         # Logic for DOM cloning, marking, and rasterization.
│   ├── encoder.ts         # Handles assembling PNG frames into a GIF.
│   ├── metadata.ts        # Gathers click coords, element paths, HTML snapshots.
│   └── state.ts           # Manages the recorder's internal state.
│
├── react/
│   ├── ClickReel.tsx      # The main component orchestrating the recorder.
│   ├── RecorderUI.tsx     # The floating UI component (buttons, indicators).
│   └── useRecorder.ts     # A custom hook to manage recorder state and logic.
│
├── utils/
│   └── dom-utils.ts       # Helper functions (e.g., robust element path generation).
│
└── types.ts               # Centralized TypeScript type definitions.

```

The `useRecorder.ts` hook will contain all state management and core logic, exposing an API like `{ start, stop, arm, state, frames }`. The `ClickReel.tsx` component will use this hook to orchestrate the process, passing state and control functions to the `RecorderUI.tsx` component, which is responsible only for rendering the view.

### Proposed Library Dependencies

To accelerate development and avoid reinventing complex functionality, the following NPM packages are proposed:

1. **DOM Rasterization**:

   * **`html-to-image`**: The core library for capturing screenshots of DOM elements.

2. **GIF Encoding**:

   * **`gifenc`**: A fast, client-side library for encoding a sequence of frames into an animated GIF.

3. **ZIP Bundling**:

   * **`jszip`**: For creating a `.zip` archive containing the final GIF and the metadata JSON file.

4. **Floating UI**:

   * **`react-draggable`**: To make the floating recorder UI easily movable on the screen.

5. **UI Icons**:

   * **`lucide-react`**: For clean, lightweight icons in the recorder UI (e.g., record, stop, save).

***

## Technical Implementation Details

### GIF Encoding and Feedback

Client-side GIF encoding can be CPU-intensive. To provide a good user experience:

* When the "Finish and export" action is triggered, the UI will display a "Processing..." or "Generating GIF..." state to inform the user that work is being done.

* A sensible upper limit on the number of captured frames (e.g., 100) will be enforced to prevent the browser from becoming unresponsive on very long recordings.

### Image Comparison

To implement the "stop capturing when two consecutive snapshots are visually identical" heuristic, a performant comparison method is required.

* The image data from each captured frame will be converted to a Base64 data URL string.

* The recorder will then perform a simple string comparison on these Base64 URLs. This is significantly faster than a pixel-by-pixel comparison and is highly effective for detecting visual changes.

***

## Final Implementation Decisions

**1. Tap Marker Style**
The "tap marker" will be a semi-transparent, colored circle implemented with CSS, positioned absolutely over the click location in the cloned DOM. The default style will be a red circle with a subtle animation, but this will be configurable via the `markerStyle` option.

**2. Post-Click Frame Capture Heuristic**
To capture animations and transitions, the recorder will use a time-based heuristic. After the initial pre-click snapshot:

1. Wait a fixed period (e.g., 500ms) and take the first "post-click" snapshot.

2. Then, take subsequent snapshots at a short interval (e.g., 100ms).

3. Stop capturing when two consecutive snapshots are visually identical or after a total maximum duration (e.g., 4000ms) has elapsed.

**3. Robust Element Path Generation**
To generate a robust path to the clicked element for the metadata sidecar, the recorder will prioritize attributes in the following order:

1. `data-testid` attribute.

2. Element `id`.

3. If neither is found, it will fall back to generating a path of element names and `nth-child` indices from the capture root.

**4. HTML Sanitization and Obfuscation**
HTML content can be obfuscated to protect user data.

* A key sequence (e.g., `Ctrl+Shift+O`) will toggle obfuscation on and off.

* When enabled, the recorder will attempt to identify and randomize character data within elements that typically contain user-generated content (e.g., `<p>`, `<span>`, form inputs).

* Generic structural elements and headers (e.g., `<h1>`, `<div>`, `<button>`) will have their text content left intact to preserve context.
