/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Radio, Ear } from 'lucide-react';
import { SafetySession } from '../safety-kernel/types';

interface AudioVisualizerProps {
  session: SafetySession;
  audioLevel: number;
  isMicMuted: boolean;
  onToggleMicMute: () => void;
  onSimulateVoiceUtterance: (text: string) => void;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  session,
  audioLevel,
  isMicMuted,
  onToggleMicMute,
  onSimulateVoiceUtterance,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic canvas audio waveform drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isSpeaking = session.isCompanionSpeaking || session.isUserSpeaking || audioLevel > 0.05;
      const activeColor = session.isCompanionSpeaking
        ? 'rgba(16, 185, 129, 0.85)' // Emerald for Gemini
        : session.isUserSpeaking
        ? 'rgba(99, 102, 241, 0.85)' // Indigo for Passenger
        : 'rgba(100, 116, 139, 0.4)'; // Slate idle

      // Draw dynamic multi-sine waveform
      const lines = [
        { amp: isSpeaking ? 18 * Math.max(audioLevel, 0.3) : 3, freq: 0.03, speed: 0.08, alpha: 0.9 },
        { amp: isSpeaking ? 12 * Math.max(audioLevel, 0.2) : 2, freq: 0.05, speed: 0.05, alpha: 0.5 },
        { amp: isSpeaking ? 8 * Math.max(audioLevel, 0.25) : 1.5, freq: 0.02, speed: 0.03, alpha: 0.3 },
      ];

      for (const line of lines) {
        ctx.beginPath();
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = line.alpha;

        for (let x = 0; x < width; x++) {
          const y =
            height / 2 +
            Math.sin(x * line.freq + phase * line.speed) * line.amp * Math.sin((x / width) * Math.PI);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      phase += 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [audioLevel, session.isCompanionSpeaking, session.isUserSpeaking]);

  const getTensionBadge = () => {
    switch (session.audioTensionLevel) {
      case 'WHISPERING':
        return { label: 'Whispering (Covert)', color: 'bg-amber-950/70 text-amber-300 border-amber-500/40' };
      case 'DISTRESSED':
        return { label: 'Tense / Distressed Language', color: 'bg-rose-950/70 text-rose-300 border-rose-500/40' };
      case 'TENSE':
        return { label: 'Elevated Vocal Strain', color: 'bg-yellow-950/70 text-yellow-300 border-yellow-500/40' };
      default:
        return { label: 'Neutral / Conversational', color: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30' };
    }
  };

  const tensionConfig = getTensionBadge();

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Live Multimodal Audio Stream</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tensionConfig.color}`}>
            {tensionConfig.label}
          </span>
          <button
            onClick={onToggleMicMute}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
              isMicMuted
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMicMuted ? 'Microphone muted' : 'Mute microphone'}
          >
            {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="text-[11px] font-medium">{isMicMuted ? 'Muted' : 'Mic Active'}</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas & Status */}
      <div className="relative bg-slate-950/70 rounded-xl border border-slate-800/80 p-3 overflow-hidden flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={480}
          height={76}
          className="w-full h-18 object-contain"
        />

        {/* Dynamic status pill */}
        <div className="mt-2 flex items-center justify-between w-full px-2 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            {session.isCompanionSpeaking ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                Gemini Live Voice Active (24kHz PCM)
              </span>
            ) : session.isUserSpeaking ? (
              <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                <Ear className="w-3.5 h-3.5 animate-pulse" />
                Passenger Speaking (16kHz Raw)
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1">
                <Radio className="w-3 h-3 text-slate-600" />
                Listening for conversational intent & distress cues...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>AEC: On</span>
            <span>·</span>
            <span>Barge-in: Armed</span>
          </div>
        </div>
      </div>

      {/* Voice Prompt Simulator (Crucial for Demo & Hands-free testing) */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Voice Phrases (Click to simulate speaking to Gemini Live):
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => onSimulateVoiceUtterance("I'm feeling uncomfortable with this driver.")}
            className="px-2.5 py-1.5 text-xs text-left rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            "I'm uncomfortable"
          </button>
          <button
            onClick={() => onSimulateVoiceUtterance("Don't say anything out loud. Keep quiet.")}
            className="px-2.5 py-1.5 text-xs text-left rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-amber-300 transition-colors cursor-pointer"
          >
            "Don't speak out loud"
          </button>
          <button
            onClick={() => onSimulateVoiceUtterance("I need help. The cab has stopped in a dark alley.")}
            className="px-2.5 py-1.5 text-xs text-left rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-rose-300 transition-colors cursor-pointer"
          >
            "I need help"
          </button>
          <button
            onClick={() => onSimulateVoiceUtterance("I'm safe now. I reached home.")}
            className="px-2.5 py-1.5 text-xs text-left rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-300 transition-colors cursor-pointer"
          >
            "I'm safe now"
          </button>
        </div>
      </div>
    </div>
  );
};
