/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {LitElement, css, html} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {Analyser} from './analyser';

/**
 * 2D bar audio visual.
 */
@customElement('gdm-live-audio-visuals-3d')
export class GdmLiveAudioVisuals3D extends LitElement {
  private inputAnalyser!: Analyser;
  private outputAnalyser!: Analyser;
  private _outputNode!: AudioNode;

  @property()
  set outputNode(node: AudioNode) {
    this._outputNode = node;
    this.outputAnalyser = new Analyser(this._outputNode);
  }

  get outputNode() {
    return this._outputNode;
  }

  private _inputNode!: AudioNode;

  @property()
  set inputNode(node: AudioNode) {
    this._inputNode = node;
    this.inputAnalyser = new Analyser(this._inputNode);
  }

  get inputNode() {
    return this._inputNode;
  }

  @query('canvas')
  private canvas!: HTMLCanvasElement;
  private canvasCtx!: CanvasRenderingContext2D;

  static styles = css`
    canvas {
      width: 100% !important;
      height: 100% !important;
      position: absolute;
      inset: 0;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.visualize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize() {
    if (this.canvas) {
      const bounds = this.canvas.getBoundingClientRect();
      this.canvas.width = bounds.width;
      this.canvas.height = bounds.height;
    }
  }

  private visualize() {
    requestAnimationFrame(() => this.visualize());

    if (
      !this.canvas ||
      !this.canvasCtx ||
      !this.outputAnalyser ||
      !this.inputAnalyser
    ) {
      return;
    }

    const canvas = this.canvas;
    const canvasCtx = this.canvasCtx;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const bufferLength = this.inputAnalyser.data.length;
    const barStep = WIDTH / bufferLength;
    const barWidth = barStep * 0.7;
    const centerY = HEIGHT / 2;

    // Draw output audio bars (white)
    this.outputAnalyser.update();
    canvasCtx.fillStyle = '#FFFFFF';
    for (let i = 0; i < bufferLength; i++) {
      const x = i * barStep + (barStep - barWidth) / 2;
      const barHeight = (this.outputAnalyser.data[i] * (HEIGHT / 2)) / 255;
      if (barHeight > 1) {
        this.drawRoundedRect(
          canvasCtx,
          x,
          centerY - barHeight,
          barWidth,
          barHeight * 2,
          4,
        );
      }
    }

    // Draw input audio bars (light gray) with a lighter effect where they overlap
    canvasCtx.globalCompositeOperation = 'lighter';
    this.inputAnalyser.update();
    canvasCtx.fillStyle = '#CCCCCC';
    for (let i = 0; i < bufferLength; i++) {
      const x = i * barStep + (barStep - barWidth) / 2;
      const barHeight = (this.inputAnalyser.data[i] * (HEIGHT / 2)) / 255;
      if (barHeight > 1) {
        this.drawRoundedRect(
          canvasCtx,
          x,
          centerY - barHeight,
          barWidth,
          barHeight * 2,
          4,
        );
      }
    }
    canvasCtx.globalCompositeOperation = 'source-over'; // Reset composite operation
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
  }

  protected firstUpdated() {
    this.canvasCtx = this.canvas.getContext('2d')!;
    // Delay resize to allow parent component to render and size the container
    setTimeout(() => {
      this.onWindowResize();
    }, 0);
  }



  protected render() {
    return html`<canvas></canvas>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-live-audio-visuals-3d': GdmLiveAudioVisuals3D;
  }
}