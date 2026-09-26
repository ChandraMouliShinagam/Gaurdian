/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, Shield, Check, Lock, ChevronLeft, Mic, Sparkles } from 'lucide-react';
import { SafetySession, TripTelemetry } from '../safety-kernel/types';

interface DiscreetCovertViewProps {
  session: SafetySession;
  trip: TripTelemetry;
  onExitDiscreetMode: () => void;
  onTriggerDiscreetEmergency: () => void;
}

export const DiscreetCovertView: React.FC<DiscreetCovertViewProps> = ({
  session,
  trip,
  onExitDiscreetMode,
  onTriggerDiscreetEmergency,
}) => {
  const [calcInput, setCalcInput] = useState('2,480.00');
  const [activeTab, setActiveTab] = useState<'notes' | 'calculator'>('notes');

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 text-slate-100 flex flex-col justify-between p-4 font-sans select-none">
      {/* Covert Top Bar disguised as everyday app with covert micro safety badge */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400 text-sm">Notes & Expenses</span>
        </div>

        {/* Covert Micro Safety Status */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-300 font-bold">{session.riskScore}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{formatSeconds(session.timeRemainingSeconds)}</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">C1: Ready</span>
        </div>

        <button
          onClick={onExitDiscreetMode}
          className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
          title="Return to full command center"
        >
          <Eye className="w-3.5 h-3.5" />
          Exit
        </button>
      </div>

      {/* Disguised Main View: Everyday Grocery / Travel Expense Note */}
      <div className="max-w-md mx-auto w-full flex-1 py-6 space-y-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 shadow-lg">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Today's Travel & Errands</div>
          <h2 className="text-lg font-bold text-slate-200">Trip to Financial District</h2>

          <div className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Cab Fare (Swift Dzire)</span>
              <span className="font-mono text-slate-200">₹420.00</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Arrival</span>
              <span className="font-mono text-slate-200">11:45 PM</span>
            </div>
            <div className="flex justify-between">
              <span>Grocery List items</span>
              <span className="text-slate-400">Milk, Bread, Tea, Almonds</span>
            </div>
          </div>
        </div>

        {/* Covert Voice Status Card */}
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs space-y-2">
          <div className="flex items-center justify-between text-amber-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Covert Listening Active
            </span>
            <span className="text-[10px] font-mono text-amber-400">VOICE MUTED</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Gemini is silently monitoring cabin conversation. Voice responses are muted so the driver cannot hear.
            Timer will silently notify Sunita (Mom) if unconfirmed for 10 simulated minutes.
          </p>
        </div>

        {/* Discreet Silent SOS Button (Disguised as save note) */}
        <div className="pt-4">
          <button
            onClick={onTriggerDiscreetEmergency}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4 text-slate-500 hover:text-rose-400" />
            <span>Silent Emergency Escalation (Instant Contact #1 Dispatch)</span>
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-md mx-auto w-full text-center text-[10px] text-slate-600 font-mono">
        GUARDIAN STEALTH MODE · ENCRYPTED LOCAL SAFE-ZONE
      </div>
    </div>
  );
};
