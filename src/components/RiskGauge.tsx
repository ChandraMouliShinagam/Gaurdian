/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, AlertOctagon, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { RiskState, SafetySignal } from '../safety-kernel/types';

interface RiskGaugeProps {
  riskScore: number;
  riskState: RiskState;
  signals: SafetySignal[];
  onAddManualSOS: () => void;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ riskScore, riskState, signals, onAddManualSOS }) => {
  const getStateConfig = () => {
    switch (riskState) {
      case 'CRITICAL':
        return {
          color: 'text-rose-500',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/40',
          indicator: 'bg-rose-500',
          icon: AlertOctagon,
          label: 'CRITICAL',
          desc: 'Imminent danger threshold exceeded. Emergency workflows armed.',
        };
      case 'ELEVATED':
        return {
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/40',
          indicator: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'ELEVATED',
          desc: 'Multiple compounding risk factors. Escalation timer armed.',
        };
      case 'CONCERN':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/40',
          indicator: 'bg-yellow-400',
          icon: AlertCircle,
          label: 'CONCERN',
          desc: 'Situational anomaly observed. Active check-in initiated.',
        };
      default:
        return {
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          indicator: 'bg-emerald-400',
          icon: CheckCircle2,
          label: 'NORMAL',
          desc: 'Telemetry on schedule. Passive background monitoring active.',
        };
    }
  };

  const config = getStateConfig();
  const StateIcon = config.icon;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      {/* Top Bar: Title & Core Principle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Cumulative Risk Engine</h2>
          <p className="text-[11px] text-slate-500">Deterministic Safety Kernel Policy Score (0–100)</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            KERNEL RULE EVALUATOR
          </span>
        </div>
      </div>

      {/* Main Score & State Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-4">
        {/* Risk Score Circle / Meter */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Progress Track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`transition-all duration-700 ease-out ${
                  riskScore >= 75 ? 'stroke-rose-500' :
                  riskScore >= 50 ? 'stroke-amber-500' :
                  riskScore >= 25 ? 'stroke-yellow-400' : 'stroke-emerald-400'
                }`}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - riskScore / 100)}`}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Score in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-4xl font-black font-mono tracking-tight ${config.color}`}>
                {riskScore}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">/ 100</span>
            </div>
          </div>

          <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color} border ${config.border}`}>
            <StateIcon className="w-4 h-4" />
            {config.label}
          </div>
        </div>

        {/* State Breakdown & Thresholds */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-3">
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Risk Threshold Ladder:</span>
              <span className="text-[11px] font-mono text-slate-300">0 · 25 · 50 · 75+</span>
            </div>
            {/* Visual Segments */}
            <div className="grid grid-cols-4 gap-1.5 h-2.5 rounded-full overflow-hidden">
              <div className={`rounded-sm transition-all ${riskScore >= 0 ? 'bg-emerald-500' : 'bg-slate-800'}`} title="0-24 Normal" />
              <div className={`rounded-sm transition-all ${riskScore >= 25 ? 'bg-yellow-400' : 'bg-slate-800'}`} title="25-49 Concern" />
              <div className={`rounded-sm transition-all ${riskScore >= 50 ? 'bg-amber-500' : 'bg-slate-800'}`} title="50-74 Elevated" />
              <div className={`rounded-sm transition-all ${riskScore >= 75 ? 'bg-rose-500 animate-pulse' : 'bg-slate-800'}`} title="75-100 Critical" />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{config.desc}</p>
          </div>

          {/* Quick Manual SOS Override */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onAddManualSOS}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              Manual Emergency SOS (+60)
            </button>
          </div>
        </div>
      </div>

      {/* Signal Weights Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Active Safety Signals ({signals.length})</span>
          <span className="text-[10px] text-slate-500 font-mono">Real-time signal stream</span>
        </div>

        {signals.length === 0 ? (
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">No anomaly signals recorded. Session telemetry clean.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono font-bold text-amber-400 shrink-0">+{sig.weight}</span>
                  <span className="truncate font-medium text-slate-200">{sig.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {sig.source.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(sig.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Core Principle Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>GEMINI UNDERSTANDS</span>
        <span className="text-slate-600">•</span>
        <span className="text-indigo-400 font-semibold">SAFETY KERNEL DECIDES</span>
      </div>
    </div>
  );
};
