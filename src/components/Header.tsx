/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, ShieldAlert, Wifi, WifiOff, Volume2, VolumeX, EyeOff, Radio, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EscapeMode, NetworkState, RiskState } from '../safety-kernel/types';

interface HeaderProps {
  riskState: RiskState;
  networkState: NetworkState;
  escapeMode: EscapeMode;
  isLiveConnected: boolean;
  isCompanionSpeaking: boolean;
  isSimulationFast: boolean;
  onToggleFastSimulation: () => void;
  onSelectEscapeMode: (mode: EscapeMode) => void;
  onToggleNetwork: () => void;
  onOpenEvidenceModal: () => void;
  onOpenIncidentReport: () => void;
  onMarkSafe: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  riskState,
  networkState,
  escapeMode,
  isLiveConnected,
  isCompanionSpeaking,
  isSimulationFast,
  onToggleFastSimulation,
  onSelectEscapeMode,
  onToggleNetwork,
  onOpenEvidenceModal,
  onOpenIncidentReport,
  onMarkSafe,
}) => {
  const getRiskBorder = () => {
    switch (riskState) {
      case 'CRITICAL':
        return 'border-rose-500/40 bg-rose-950/20';
      case 'ELEVATED':
        return 'border-amber-500/40 bg-amber-950/20';
      case 'CONCERN':
        return 'border-yellow-500/40 bg-yellow-950/20';
      default:
        return 'border-slate-800 bg-slate-900/60';
    }
  };

  return (
    <header className={`border-b backdrop-blur-md px-4 py-3 transition-colors duration-300 ${getRiskBorder()}`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-all ${
              riskState === 'CRITICAL' ? 'bg-rose-600 animate-pulse' :
              riskState === 'ELEVATED' ? 'bg-amber-600' :
              riskState === 'CONCERN' ? 'bg-yellow-600' : 'bg-indigo-600'
            }`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            {isLiveConnected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-lg text-white font-mono">GUARDIAN</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                PROTOTYPE
              </span>
              {isCompanionSpeaking && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  <Radio className="w-3 h-3 animate-spin" />
                  Gemini Speaking
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 italic">"Stay with me when I can't ask anyone else."</p>
          </div>
        </div>

        {/* Network & Safety Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Network Switcher */}
          <button
            onClick={onToggleNetwork}
            title="Toggle Network connectivity to test Gemma 4 Edge Offline Fallback"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
              networkState === 'ONLINE'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                : networkState === 'OFFLINE_GEMMA'
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:bg-amber-900/80 animate-pulse'
                : 'bg-blue-950/60 text-blue-300 border-blue-500/50 animate-pulse'
            }`}
          >
            {networkState === 'ONLINE' && (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>ONLINE: Gemini 3.8 Live</span>
              </>
            )}
            {networkState === 'OFFLINE_GEMMA' && (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">OFFLINE: Gemma 4 E2B</span>
              </>
            )}
            {networkState === 'SYNCING' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>SYNCING SESSION...</span>
              </>
            )}
          </button>

          {/* Simulation Accelerator Toggle */}
          <button
            onClick={onToggleFastSimulation}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
              isSimulationFast
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Demo speed: 1 real second = 1 simulated minute"
          >
            DEMO SIMULATION: {isSimulationFast ? '1s = 1min ⚡' : '1x Realtime'}
          </button>

          {/* Escape Modes */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => onSelectEscapeMode('NONE')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                escapeMode === 'NONE' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard Voice Companion"
            >
              Standard
            </button>
            <button
              onClick={() => onSelectEscapeMode('DISCREET')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                escapeMode === 'DISCREET' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Covert Mute & Camouflage"
            >
              <EyeOff className="w-3 h-3" />
              Discreet
            </button>
            <button
              onClick={() => onSelectEscapeMode('SILENT')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                escapeMode === 'SILENT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Silent Escalation Only"
            >
              <VolumeX className="w-3 h-3" />
              Silent
            </button>
            <button
              onClick={() => onSelectEscapeMode('LOUD')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                escapeMode === 'LOUD' ? 'bg-rose-600 text-white shadow-sm animate-pulse' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Deterrent Siren Alarm"
            >
              <Volume2 className="w-3 h-3" />
              Loud Alarm
            </button>
          </div>

          {/* Quick Tools */}
          <button
            onClick={onOpenEvidenceModal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            title="Analyze screenshot or message with Gemini 3.8 Flash"
          >
            Evidence Vault
          </button>

          <button
            onClick={onOpenIncidentReport}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            title="Generate structured post-incident report with Gemini 3.8 Flash"
          >
            Incident Report
          </button>

          <button
            onClick={onMarkSafe}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors cursor-pointer"
            title="Disarm alarms and confirm safety"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            I'm Safe
          </button>
        </div>
      </div>
    </header>
  );
};
