/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic, Volume2, Globe, Users, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import { SafetySession } from '../safety-kernel/types';

interface LiveAudioContextPanelProps {
  session: SafetySession;
  onSimulateSpeakerTurn: (speaker: 'Passenger' | 'Driver', language: 'English' | 'Telugu' | 'Hindi', text: string) => void;
}

export const LiveAudioContextPanel: React.FC<LiveAudioContextPanelProps> = ({
  session,
  onSimulateSpeakerTurn,
}) => {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Live Acoustic & Speaker Context</h3>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
          Non-diagnostic Neutral Analysis
        </div>
      </div>

      {/* Speaker Diarization / Multi-Language Tracking */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Passenger */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Speaker 0: Passenger
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
              Telugu / English
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Vocal State:</span>
              <span className="font-mono text-slate-200">
                {session.audioTensionLevel === 'WHISPERING'
                  ? 'Covert Whispering (0.92 conf)'
                  : session.audioTensionLevel === 'DISTRESSED'
                  ? 'Elevated Strain (0.87 conf)'
                  : 'Normal Conversational (0.95 conf)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Tension:</span>
              <span className="font-mono text-slate-200">
                {session.riskScore >= 50 ? 'Moderate-High' : session.riskScore >= 25 ? 'Mild' : 'Low / Baseline'}
              </span>
            </div>
          </div>
        </div>

        {/* Driver */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Speaker 1: Driver
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Hindi / Dakhni
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Vocal State:</span>
              <span className="font-mono text-slate-200">Assertive / Monotone</span>
            </div>
            <div className="flex justify-between">
              <span>Language Bridge:</span>
              <span className="font-mono text-emerald-400 font-semibold">Active Real-Time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Language Bridge Demo Bar */}
      <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 mb-3 text-xs">
        <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            Cross-Lingual Dialogue Interpretation:
          </span>
          <span className="text-[10px] font-mono text-slate-500">Live Gemini In-Context</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 italic text-[11px]">
          "Driver spoke Hindi: 'Raasta aage block hai, doosra cut le raha hoon' → Translated for Passenger: 'The road ahead is blocked, taking an alternative bypass.'"
        </div>
      </div>

      {/* Acoustic Context Simulation Buttons for Presenter */}
      <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={() =>
            onSimulateSpeakerTurn(
              'Passenger',
              'English',
              'Driver, why are you turning away from the main highway? This road is completely dark.',
            )
          }
          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-300 transition-colors cursor-pointer"
        >
          + Passenger Query
        </button>

        <button
          onClick={() =>
            onSimulateSpeakerTurn(
              'Driver',
              'Hindi',
              'Short-cut hai madam, jaldi pahunch jaoge. Fikar mat karo.',
            )
          }
          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          + Driver Response (Hindi)
        </button>
      </div>
    </div>
  );
};
