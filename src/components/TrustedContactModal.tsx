/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldAlert, Phone, MapPin, Clock, AlertTriangle, Send, Share2, Smartphone } from 'lucide-react';
import { SafetyAlertPacket, SafetyPolicy, SafetySession, TripTelemetry } from '../safety-kernel/types';

interface TrustedContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SafetySession;
  policy: SafetyPolicy;
  trip: TripTelemetry;
  onMarkSafe: () => void;
}

export const TrustedContactModal: React.FC<TrustedContactModalProps> = ({
  isOpen,
  onClose,
  session,
  policy,
  trip,
  onMarkSafe,
}) => {
  if (!isOpen) return null;

  const latestAlert: SafetyAlertPacket = session.escalationHistory[0] || {
    id: 'ALT-PREVIEW',
    timestamp: Date.now(),
    user: policy.userName,
    escalationLevel: 1,
    escalationTarget: `${policy.trustedContacts[0].name} (${policy.trustedContacts[0].phone})`,
    riskScore: session.riskScore,
    riskState: session.riskState,
    signals: session.signals.map((s) => `+${s.weight} ${s.label}`),
    location: trip.currentLocation,
    journey: `${trip.origin} → ${trip.destination}`,
    timeSinceLastResponseSec: Math.floor((Date.now() - session.lastUserInteractionAt) / 1000),
    lastUserConfirmedState: session.lastUserConfirmedState,
    summary: 'Automated safety check-in timed out without passenger response.',
    dispatchedVia: session.networkState === 'OFFLINE_GEMMA' ? 'LOCAL_SMS_FALLBACK' : 'SMS_GATEWAY',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Device Frame Top Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-medium text-slate-300">
              SIMULATED RECEIVER: {policy.trustedContacts[0].name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lockscreen Notification Body */}
        <div className="p-6 space-y-4">
          {/* Urgent Alert Banner */}
          <div className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 shadow-lg text-rose-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
                <span className="font-extrabold tracking-wider text-base text-rose-200">
                  GUARDIAN SAFETY ALERT
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-600 font-bold">
                LEVEL {latestAlert.escalationLevel} ESCALATION
              </span>
            </div>

            <p className="text-xs text-rose-200/90 font-medium leading-relaxed">
              This automated alert was dispatched by GUARDIAN because passenger{' '}
              <strong className="text-white underline">{latestAlert.user}</strong> encountered elevated risk factors
              and has not acknowledged check-in.
            </p>
          </div>

          {/* Formatted Alert Packet Data */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs space-y-2.5 text-slate-300">
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">PASSENGER:</span>
              <span className="font-bold text-white">{latestAlert.user}</span>
            </div>

            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">RISK SCORE:</span>
              <span className="font-bold text-rose-400">
                {latestAlert.riskScore} / 100 ({latestAlert.riskState})
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">JOURNEY:</span>
              <span className="text-right text-slate-300 truncate max-w-[260px]">{latestAlert.journey}</span>
            </div>

            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">CAB & DRIVER:</span>
              <span className="text-right text-amber-300">
                {trip.driverVehicle} ({trip.plateNumber}) · {trip.driverName}
              </span>
            </div>

            <div className="border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500 block mb-1">RECORDED SIGNALS:</span>
              {latestAlert.signals.length === 0 ? (
                <span className="text-slate-400 italic">None logged yet</span>
              ) : (
                <ul className="space-y-0.5 pl-2 text-[11px] text-amber-300 font-sans">
                  {latestAlert.signals.map((sig, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      {sig}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-500">LAST KNOWN STATE:</span>
              <span className="text-right text-slate-200 italic max-w-[240px] truncate">
                {latestAlert.lastUserConfirmedState}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 text-[11px]">
              <span className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                LAST GPS FIX:
              </span>
              <span className="text-indigo-400 font-bold">
                {latestAlert.location.lat.toFixed(4)}, {latestAlert.location.lng.toFixed(4)}
              </span>
            </div>

            <div className="text-[10px] text-slate-500 truncate">
              {latestAlert.location.address}
            </div>

            <div className="text-[10px] text-slate-600 flex justify-between pt-1">
              <span>DISPATCH METHOD: {latestAlert.dispatchedVia}</span>
              <span>TIME: {new Date(latestAlert.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Receiver Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => alert(`Calling Priya Sharma (+91 98490 12345)...`)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              Call Priya Now
            </button>

            <button
              onClick={() => {
                onMarkSafe();
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Confirm Priya Safe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
