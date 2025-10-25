# Custom Audio Visualizer Integration Guide

This document provides a step-by-step guide on how to create your own custom audio visualizer component and integrate it into the main chat application.

## 1. Project Overview

The application is built using [Lit](https://lit.dev/), a simple library for building fast web components. The core logic resides in a few key files:

-   `index.tsx`: The main application component (`<gdm-live-audio>`) that handles the Gemini API connection, audio processing, and chat UI.
-   `visual-3d.ts`: The current bar visualizer component (`<gdm-live-audio-visuals-3d>`). This is the component you will replace.
-   `analyser.ts`: A utility class that wraps the Web Audio API's `AnalyserNode` to simplify getting frequency data.

The main application passes two crucial properties to the visualizer component: `inputNode` (your microphone audio) and `outputNode` (the model's audio response). Your custom visualizer will use these `AudioNode` objects to get the data it needs to draw.

## 2. Creating Your Custom Visualizer

You will create a new Lit component in a new file. Let's call it `my-custom-visualizer.ts`.

### Step 2.1: Create the File

Create a new file named `my-custom-visualizer.ts` in the same directory as the other source files.

### Step 2.2: Add Boilerplate Code

Use the following template as a starting point for your new component. It includes all the necessary parts to receive audio data and set up a canvas for drawing.

```typescript
// my-custom-visualizer.ts

import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Analyser } from './analyser'; // Assumes file is in the same directory

@customElement('my-custom-visualizer')
export class MyCustomVisualizer extends LitElement {
  // --- Properties to receive audio nodes from the parent ---
  @property({ type: Object })
  set inputNode(node: AudioNode) {
    if (node) this.inputAnalyser = new Analyser(node);
  }

  @property({ type: Object })
  set outputNode(node: AudioNode) {
    if (node) this.outputAnalyser = new Analyser(node);
  }

  // --- Private class members ---
  private inputAnalyser!: Analyser;
  private outputAnalyser!: Analyser;

  @query('canvas') private canvas!: HTMLCanvasElement;
  private canvasCtx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  // --- Styles for your component ---
  static styles = css`
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `;

  // --- Lifecycle Methods ---

  connectedCallback() {
    super.connectedCallback();
    // Start the animation loop
    this.visualize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Stop the animation loop to save resources
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  protected firstUpdated() {
    // Get the canvas context once the component has rendered
    this.canvasCtx = this.canvas.getContext('2d')!;
    this.resizeCanvas();
    // Add a resize listener if you want it to be responsive
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  // --- Custom Logic ---

  private resizeCanvas() {
    const bounds = this.getBoundingClientRect();
    this.canvas.width = bounds.width;
    this.canvas.height = bounds.height;
  }

  private visualize() {
    // Create an animation loop
    this.animationFrameId = requestAnimationFrame(() => this.visualize());

    if (!this.canvasCtx || !this.inputAnalyser || !this.outputAnalyser) {
      return;
    }

    // Get the latest frequency data from the analysers
    this.inputAnalyser.update();
    this.outputAnalyser.update();

    const inputData = this.inputAnalyser.data;
    const outputData = this.outputAnalyser.data;
    const bufferLength = inputData.length;
    const WIDTH = this.canvas.width;
    const HEIGHT = this.canvas.height;

    //
    // --- YOUR CUSTOM DRAWING LOGIC GOES HERE ---
    //
    // This is where you'll implement your unique visualizer.
    // You have access to `inputData` and `outputData`, which are
    // Uint8Array objects containing frequency values from 0-255.
    //

    // Example: Clear the canvas and draw a simple line for the input volume
    this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    this.canvasCtx.fillStyle = '#222';
    this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    let averageInput = inputData.reduce((a, b) => a + b) / bufferLength;
    this.canvasCtx.fillStyle = 'cyan';
    this.canvasCtx.fillRect(0, HEIGHT - 10, (averageInput / 255) * WIDTH, 10);
    //
    // --- END OF CUSTOM DRAWING LOGIC ---
    //
  }

  // --- Render Method ---

  protected render() {
    // Render the canvas element that you will draw on
    return html`<canvas></canvas>`;
  }
}

// Declare the new element for TypeScript type safety
declare global {
  interface HTMLElementTagNameMap {
    'my-custom-visualizer': MyCustomVisualizer;
  }
}
```

## 3. Integrating Your New Visualizer

Now that you have your new component, you need to tell the main application to use it.

### Step 3.1: Import Your Component

Open `index.tsx` and add an import statement at the top to load your new component's code.

```typescript
// index.tsx
// ... other imports
import './my-custom-visualizer.ts'; // Add this line
```

### Step 3.2: Replace the HTML Tag

In `index.tsx`, find the `renderPopup()` method. Inside, you will see the HTML for the existing visualizer (`<gdm-live-audio-visuals-3d>`).

**Replace this:**

```html
<div id="visualizer-container">
  <gdm-live-audio-visuals-3d
    .inputNode=${this.inputNode}
    .outputNode=${this.outputNode}>
  </gdm-live-audio-visuals-3d>
</div>
```

**With this:**

```html
<div id="visualizer-container">
  <my-custom-visualizer
    .inputNode=${this.inputNode}
    .outputNode=${this.outputNode}>
  </my-custom-visualizer>
</div>
```

That's it! When you run the application, it will now load and display your custom visualizer inside the chat popup. You can now focus on building out the drawing logic inside the `visualize()` method of `my-custom-visualizer.ts`.
