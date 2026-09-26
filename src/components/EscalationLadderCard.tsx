/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Timer, PhoneCall, AlertTriangle, ShieldCheck, Check, Send, ExternalLink, FastForward } from 'lucide-react';
import { SafetyPolicy, SafetySession } from '../safety-kernel/types';

interface EscalationLadderCardProps {
  session: SafetySession;
  policy: SafetyPolicy;
  isSimulationFast: boolean;
  onFastForwardTimeout: () => void;
  onOpenAlertPreview: () => void;
  onMarkSafe: () => void;
  onTriggerManualEscalation: (level: 1 | 2 | 3) => void;
}

export const EscalationLadderCard: React.FC<EscalationLadderCardProps> = ({
  session,
  policy,
  isSimulationFast,
  onFastForwardTimeout,
  onOpenAlertPreview,
  onMarkSafe,
  onTriggerManualEscalation,
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Deterministic Escalation Ladder</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            POLICY RULE 10-MIN
          </span>
        </div>
      </div>

      {/* Safety Countdown Timer Widget */}
      <div className={`p-4 rounded-xl border mb-3 transition-colors ${
        session.timerArmed
          ? session.timeRemainingSeconds <= 60
            ? 'bg-rose-950/50 border-rose-500/50 animate-pulse'
            : 'bg-amber-950/40 border-amber-500/40'
          : 'bg-slate-950/60 border-slate-800/80'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Check-in Response Window</span>
              {session.timerArmed ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ARMED
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                  STANDBY
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {session.timerArmed
                ? 'Escalates to Contact #1 if user does not acknowledge or confirm safety.'
                : 'Arms automatically when risk crosses CONCERN (25+) or discomfort is voiced.'}
            </p>
          </div>

          {/* Digital Timer */}
          <div className="text-right">
            <div className={`font-mono text-3xl font-black tracking-tight ${
              session.timerArmed
                ? session.timeRemainingSeconds <= 60 ? 'text-rose-400' : 'text-amber-400'
                : 'text-slate-600'
            }`}>
              {formatTime(session.timeRemainingSeconds)}
            </div>
            <span className="text-[9px] uppercase font-mono text-slate-500">
              {isSimulationFast ? 'SIMULATED (1s = 1m)' : 'REALTIME (MM:SS)'}
            </span>
          </div>
        </div>

        {/* Timer Action Controls */}
        {session.timerArmed && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              onClick={onFastForwardTimeout}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 transition-colors cursor-pointer"
              title="Fast forward 10 simulated minutes to trigger deterministic escalation"
            >
              <FastForward className="w-3.5 h-3.5" />
              Fast-Forward 10 min
            </button>

            <button
              onClick={onMarkSafe}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              I'm Safe (Disarm)
            </button>
          </div>
        )}
      </div>

      {/* 3-Tier Escalation Ladder */}
      <div className="space-y-2 mb-3">
        {/* Tier 1: Mom */}
        <div className={`p-3 rounded-xl border text-xs transition-all ${
          session.currentEscalationLevel >= 1
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : 'bg-slate-950/50 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                session.currentEscalationLevel >= 1 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                1
              </span>
              <div>
                <span className="font-semibold text-slate-200">{policy.trustedContacts[0].name}</span>
                <span className="text-[11px] text-slate-400 ml-1">({policy.trustedContacts[0].relationship})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                session.currentEscalationLevel >= 1
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {session.currentEscalationLevel >= 1 ? 'ALERT DISPATCHED' : 'READY / PREPARED'}
              </span>
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">{policy.trustedContacts[0].phone}</span>
            <span>SMS + Live Tracking GPS</span>
          </div>
        </div>

        {/* Tier 2: Sister / Friend */}
        <div className={`p-3 rounded-xl border text-xs transition-all ${
          session.currentEscalationLevel >= 2
            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
            : 'bg-slate-950/30 border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                session.currentEscalationLevel >= 2 ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500'
              }`}>
                2
              </span>
              <div>
                <span className="font-semibold text-slate-200">{policy.trustedContacts[1]?.name || 'Secondary Contact'}</span>
                <span className="text-[11px] text-slate-400 ml-1">({policy.trustedContacts[1]?.relationship || 'Friend'})</span>
              </div>
            </div>

            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              session.currentEscalationLevel >= 2
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'bg-slate-800/60 text-slate-500'
            }`}>
              {session.currentEscalationLevel >= 2 ? 'ALERT DISPATCHED' : 'STANDBY (Tier 2)'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-mono">{policy.trustedContacts[1]?.phone}</span>
            <span>Triggered on +10min or repeated unresponsiveness</span>
          </div>
        </div>

        {/* Tier 3: Emergency Dispatch */}
        <div className={`p-3 rounded-xl border text-xs transition-all ${
          session.currentEscalationLevel >= 3
            ? 'bg-rose-950/60 border-rose-500 text-rose-100 font-bold animate-pulse'
            : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                session.currentEscalationLevel >= 3 ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-600'
              }`}>
                3
              </span>
              <span className="font-semibold text-slate-300">National Emergency Response (Dial 112 / PCR)</span>
            </div>

            <span className="text-[10px] font-mono text-slate-500">
              {session.currentEscalationLevel >= 3 ? 'SIMULATED DISPATCH' : 'CRITICAL OVERRIDE ONLY'}
            </span>
          </div>
        </div>
      </div>

      {/* Escalation Alert Packet Preview Trigger */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onOpenAlertPreview}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
          <span>Simulate & View Contact Alert Lockscreen</span>
          {session.escalationHistory.length > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
              {session.escalationHistory.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
