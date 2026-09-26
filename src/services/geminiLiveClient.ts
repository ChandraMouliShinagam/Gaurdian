/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GEMINI LIVE AUDIO & WEBSOCKET CLIENT
 *
 * Handles:
 * - 16kHz raw PCM mic capture with echo cancellation & noise suppression
 * - 24kHz raw PCM playback with jitter-buffer scheduling
 * - Barge-in & interruption handling
 * - Tool calls from Gemini Live to Safety Kernel
 * - Fallback simulation when API key is unavailable or offline
 */

export interface LiveClientCallbacks {
  onConnected?: (model: string) => void;
  onDisconnected?: () => void;
  onError?: (err: string) => void;
  onCompanionSpeakingChange?: (speaking: boolean) => void;
  onUserSpeakingChange?: (speaking: boolean) => void;
  onInterrupted?: () => void;
  onToolCall?: (toolName: string, args: Record<string, unknown>, id: string) => void;
  onAudioLevel?: (level: number, source: 'user' | 'companion') => void;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private callbacks: LiveClientCallbacks;
  private isMuted = false;
  private isConnecting = false;
  private isConnected = false;
  private fallbackSyntheticVoice = false;

  constructor(callbacks: LiveClientCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected || this.isConnecting) return true;
    this.isConnecting = true;

    try {
      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Will receive 'server_ready' or 'live_connected'
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'live_connected') {
            this.isConnected = true;
            this.isConnecting = false;
            this.callbacks.onConnected?.(data.model || 'gemini-3.8-live');
          } else if (data.type === 'gemini_status' && data.connected === false) {
            this.fallbackSyntheticVoice = true;
            this.callbacks.onError?.(data.error || 'Gemini Live key not configured, using fallback voice.');
          } else if (data.type === 'audio') {
            if (!this.isMuted) {
              this.playAudioChunk(data.audio);
            }
          } else if (data.type === 'interrupted') {
            this.stopPlayback();
            this.callbacks.onInterrupted?.();
          } else if (data.type === 'turn_complete') {
            this.callbacks.onCompanionSpeakingChange?.(false);
          } else if (data.type === 'tool_call') {
            this.callbacks.onToolCall?.(data.name, data.args, data.id);
          } else if (data.type === 'live_error') {
            this.callbacks.onError?.(data.error);
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onerror = () => {
        this.fallbackSyntheticVoice = true;
        this.callbacks.onError?.('Live WebSocket encountered an error.');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isConnecting = false;
        this.callbacks.onDisconnected?.();
      };

      // Initialize Mic Capture
      await this.initMicrophone();
      return true;
    } catch (err: any) {
      console.warn('Live API connection failed, continuing in fallback voice mode:', err);
      this.fallbackSyntheticVoice = true;
      this.isConnecting = false;
      this.callbacks.onError?.(err.message || 'Microphone or WebSocket unavailable.');
      return false;
    }
  }

  private async initMicrophone(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
      // ScriptProcessor for 16kHz chunk conversion
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate RMS audio level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const level = Math.min(1.0, rms * 5);
        this.callbacks.onAudioLevel?.(level, 'user');

        const isUserTalking = level > 0.04;
        this.callbacks.onUserSpeakingChange?.(isUserTalking);

        // If user talks while companion is playing, trigger interruption immediately!
        if (isUserTalking && this.activeSources.length > 0) {
          this.stopPlayback();
          this.callbacks.onInterrupted?.();
        }

        // Convert Float32Array to 16-bit PCM little-endian
        const pcm16 = this.floatTo16BitPCM(inputData);
        const base64 = this.arrayBufferToBase64(pcm16.buffer);

        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isConnected) {
          this.ws.send(
            JSON.stringify({
              type: 'realtime_audio',
              audio: base64,
            }),
          );
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);
    } catch (err) {
      console.warn('Could not access microphone hardware:', err);
    }
  }

  private initOutputAudio(): AudioContext {
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume();
    }
    return this.outputAudioCtx;
  }

  /**
   * Schedule 24kHz PCM chunk for gapless playback
   */
  public playAudioChunk(base64Audio: string): void {
    if (this.isMuted) return;

    try {
      const ctx = this.initOutputAudio();
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.05; // 50ms buffer for jitter
      }

      sourceNode.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(sourceNode);
      this.callbacks.onCompanionSpeakingChange?.(true);

      // Report simulated audio level
      this.callbacks.onAudioLevel?.(0.65, 'companion');

      sourceNode.onended = () => {
        const idx = this.activeSources.indexOf(sourceNode);
        if (idx !== -1) this.activeSources.splice(idx, 1);
        if (this.activeSources.length === 0) {
          this.callbacks.onCompanionSpeakingChange?.(false);
          this.callbacks.onAudioLevel?.(0, 'companion');
        }
      };
    } catch (e) {
      console.error('Audio chunk playback failed:', e);
    }
  }

  /**
   * Barge-in interruption: cut audio instantly
   */
  public stopPlayback(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // ignore
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
    this.callbacks.onCompanionSpeakingChange?.(false);
    this.callbacks.onAudioLevel?.(0, 'companion');

    // Also cancel any Web Speech synthesis in progress
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public injectTextPrompt(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'inject_text_prompt',
          text,
        }),
      );
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopPlayback();
    }
  }

  public disconnect(): void {
    this.stopPlayback();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }
    this.isConnected = false;
  }

  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output;
  }

  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    let binary = '';
    const bytes = new Uint8Array(buffer as ArrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
