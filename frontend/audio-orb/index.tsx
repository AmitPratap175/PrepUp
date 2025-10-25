/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, LiveServerMessage, Modality, Session} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {createBlob, decode, decodeAudioData} from './utils';
import './visual-3d';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';
  @state() isPopupVisible = false;
  @state() messages: Message[] = [];
  @state() currentInputTranscription = '';
  @state() currentOutputTranscription = '';

  private client: GoogleGenAI;
  private sessionPromise: Promise<Session>;
  private inputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 16000});
  private outputAudioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)({sampleRate: 24000});
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100vw;
      background-color: #020817;
    }

    .voice-button {
      background: #222;
      border: 1px solid #555;
      color: #fff;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .voice-button:hover {
      background: #333;
    }

    .mic-icon {
      width: 40px;
      height: 40px;
    }

    .popup-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .popup-content {
      background-color: #000;
      color: #fff;
      border: 1px solid #333;
      border-radius: 16px;
      width: 90vw;
      height: 90vh;
      max-width: 500px;
      max-height: 700px;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #333;
    }

    .popup-title {
      font-size: 1.25rem;
      font-weight: 600;
      font-family: sans-serif;
    }

    .close-button {
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
    }

    #chat-container {
      flex-grow: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .message {
      display: flex;
      max-width: 85%;
      padding: 0.5rem 0.75rem;
      border-radius: 12px;
      font-family: sans-serif;
      line-height: 1.5;
    }

    .message.user {
      align-self: flex-end;
      background-color: #fff;
      color: #000;
      border-bottom-right-radius: 4px;
    }

    .message.bot {
      align-self: flex-start;
      background-color: #222;
      color: #fff;
      border-bottom-left-radius: 4px;
    }

    .popup-footer {
      padding: 1rem;
      border-top: 1px solid #333;
    }

    #visualizer-container {
      height: 40px;
      margin-bottom: 1rem;
      position: relative;
    }

    gdm-live-audio-visuals-3d {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    .controls button {
      outline: none;
      border: 1px solid #555;
      color: white;
      border-radius: 50%;
      background: #222;
      width: 56px;
      height: 56px;
      cursor: pointer;
      font-size: 24px;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .controls button:hover {
      background: #333;
    }

    .controls button[disabled] {
      display: none;
    }
  `;

  constructor() {
    super();
    this.initClient();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has('messages') ||
      changedProperties.has('currentInputTranscription') ||
      changedProperties.has('currentOutputTranscription')
    ) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    const chatContainer = this.shadowRoot?.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.sessionPromise?.then((session) => session.close());
    if (this.isRecording) {
      this.stopRecording();
    }
  }

  private showPopup() {
    this.isPopupVisible = true;
  }

  private hidePopup() {
    this.isPopupVisible = false;
    if (this.isRecording) {
      this.stopRecording();
    }
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private initClient() {
    this.initAudio();

    this.client = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });

    this.outputNode.connect(this.outputAudioContext.destination);

    this.initSession();
  }

  private initSession() {
    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

    this.sessionPromise = this.client.live.connect({
      model: model,
      callbacks: {
        onopen: () => {
          this.updateStatus('Opened');
        },
        onmessage: async (message: LiveServerMessage) => {
          const audio =
            message.serverContent?.modelTurn?.parts[0]?.inlineData;

          if (audio) {
            this.nextStartTime = Math.max(
              this.nextStartTime,
              this.outputAudioContext.currentTime,
            );

            const audioBuffer = await decodeAudioData(
              decode(audio.data),
              this.outputAudioContext,
              24000,
              1,
            );
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode);
            source.addEventListener('ended', () => {
              this.sources.delete(source);
            });

            source.start(this.nextStartTime);
            this.nextStartTime = this.nextStartTime + audioBuffer.duration;
            this.sources.add(source);
          }

          if (message.serverContent?.inputTranscription) {
            this.currentInputTranscription +=
              message.serverContent.inputTranscription.text;
          }

          if (message.serverContent?.outputTranscription) {
            this.currentOutputTranscription +=
              message.serverContent.outputTranscription.text;
          }

          if (message.serverContent?.turnComplete) {
            const newMessages = [];
            if (this.currentInputTranscription.trim()) {
              newMessages.push({
                text: this.currentInputTranscription,
                sender: 'user' as const,
              });
            }
            if (this.currentOutputTranscription.trim()) {
              newMessages.push({
                text: this.currentOutputTranscription,
                sender: 'bot' as const,
              });
            }

            if (newMessages.length > 0) {
              this.messages = [...this.messages, ...newMessages];
            }

            this.currentInputTranscription = '';
            this.currentOutputTranscription = '';
          }

          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            for (const source of this.sources.values()) {
              source.stop();
              this.sources.delete(source);
            }
            this.nextStartTime = 0;
          }
        },
        onerror: (e: ErrorEvent) => {
          this.updateError(e.message);
        },
        onclose: (e: CloseEvent) => {
          this.updateStatus('Close:' + e.reason);
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Zephyr'}},
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });
    this.sessionPromise.catch((e) => {
      console.error(e);
      this.updateError(e.message);
    });
  }

  private updateStatus(msg: string) {
    this.status = msg;
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 4096;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;
        const pcmData = audioProcessingEvent.inputBuffer.getChannelData(0);
        this.sessionPromise.then((session) => {
          session.sendRealtimeInput({media: createBlob(pcmData)});
        });
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateError(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  private reset() {
    this.sessionPromise?.then((session) => session.close());
    this.initSession();
    this.messages = [];
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';
    this.updateStatus('Session cleared.');
  }

  private renderPopup() {
    return html`
      <div class="popup-overlay">
        <div class="popup-content">
          <div class="popup-header">
            <div class="popup-title">Live Chat</div>
            <button class="close-button" @click=${this.hidePopup}>×</button>
          </div>

          <div id="chat-container">
            ${this.messages.map(
              (msg) => html`
                <div class="message ${msg.sender}">${msg.text}</div>
              `,
            )}
            ${this.currentInputTranscription
              ? html`<div class="message user">
                  ${this.currentInputTranscription}
                </div>`
              : ''}
            ${this.currentOutputTranscription
              ? html`<div class="message bot">
                  ${this.currentOutputTranscription}
                </div>`
              : ''}
          </div>

          <div class="popup-footer">
            <div id="visualizer-container">
              <gdm-live-audio-visuals-3d
                .inputNode=${this.inputNode}
                .outputNode=${this.outputNode}>
              </gdm-live-audio-visuals-3d>
            </div>
            <div class="controls">
              <button
                id="resetButton"
                @click=${this.reset}
                ?disabled=${this.isRecording}
                aria-label="Reset Session">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="28px"
                  viewBox="0 -960 960 960"
                  width="28px"
                  fill="#ffffff">
                  <path
                    d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
                </svg>
              </button>
              <button
                id="startButton"
                @click=${this.startRecording}
                ?disabled=${this.isRecording}
                aria-label="Start Recording">
                <svg
                  class="mic-icon"
                  width="28px"
                  height="28px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                    stroke="#fff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"></path>
                  <path
                    d="M19 10v2a7 7 0 0 1-14 0v-2"
                    stroke="#fff"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"></path>
                </svg>
              </button>
              <button
                id="stopButton"
                @click=${this.stopRecording}
                ?disabled=${!this.isRecording}
                aria-label="Stop Recording">
                <svg
                  viewBox="0 0 100 100"
                  width="20px"
                  height="20px"
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="100" height="100" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <button
        class="voice-button"
        @click=${this.showPopup}
        aria-label="Open voice chat">
        <svg
          class="mic-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#ffffff"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
        </svg>
      </button>

      ${this.isPopupVisible ? this.renderPopup() : ''}
    `;
  }
}
