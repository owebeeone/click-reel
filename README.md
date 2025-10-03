# click-reel

A browser-side “interaction recorder” that captures a sequence of annotated screenshots and assembles them into an animated GIF, plus an optional metadata bundle for debugging.

## Installation

```bash
npm install click-reel
```

## Quick Start

Wrap your application or the component you want to record with the`<ClickReel /` component.

```jsx
import React from 'react';
import { ClickReel } from 'click-reel';
import YourAppComponent from './YourAppComponent';

function App() {
  return (
    <div id="capture-root">
      {/* Your application content */}
      <YourAppComponent />

      {/* Add ClickReel and point it to the root element to capture */}
      <ClickReel rootElementId="capture-root" />
    </div>
  );
}
```

## How It Works

1.  Press **`Ctrl+Shift+R`** to toggle the floating recorder UI.
2.  Click the **"Arm Recorder"** (bullseye) button.
3.  The next click you make inside your application will trigger a capture sequence.
4.  The library takes a "pre-click" snapshot, waits for animations/transitions, and takes several "post-click" snapshots.
5.  When you're done, click **"Finish & Export"** to generate a ZIP file containing an animated GIF of the interaction and a`metadata.jso` file.

## Component API: `<ClickReel />`

The main component to integrate the library.

### Props

| Prop              | Type                | Default           | Description                                                                                             |
| ----------------- | ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
|`rootElementI`   |`strin`            | **Required** | The`i` of the DOM element to capture.                                                                 |
|`scal`           |`numbe`            |``               | The resolution scale for screenshots. Higher values produce clearer images but are slower.              |
|`excludeSelecto` |`strin`            |`[data-click-reel-exclude` | A CSS selector for elements to hide during capture (e.g., for sensitive data).                  |
|`markerStyl`     |`React.CSSPropertie` | A red circle    | Custom CSS styles for the "tap marker" that appears on the pre-click frame.                             |
|`gifOption`      |`objec`            |`{ fps: 10 `     | Options for the GIF encoder, such as`fp` (frames per second).                                         |
|`collectHtm`     |`boolea`           |`tru`            | If true, includes a sanitized snapshot of the root element's`outerHTM` in the metadata.               |
|`hotke`          |`strin`            |`"Ctrl+Shift+R`  | The key combination to toggle the recorder UI.                                                          |

## Development

1.  Clone the repository and install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
    This runs a playground `src/App.js`) for testing the library.

3.  Build the library for production:
    ```bash
    npm run build
    ```

This will generate the distributable files in the `dist` folder.
