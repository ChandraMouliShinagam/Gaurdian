/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, ShieldAlert, X, PhoneCall, AlertOctagon } from 'lucide-react';
import { SafetySession, TripTelemetry } from '../safety-kernel/types';

interface LoudAlarmOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  session: SafetySession;
  trip: TripTelemetry;
  onMarkSafe: () => void;
}

export const LoudAlarmOverlay: React.FC<LoudAlarmOverlayProps> = ({
  isOpen,
  onClose,
  session,
  trip,
  onMarkSafe,
}) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start synthetic siren tone
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const playBeep = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      };

      playBeep();
      intervalRef.current = window.setInterval(playBeep, 450);
    } catch (e) {
      console.warn('Audio alarm oscillator failed:', e);
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-rose-950/95 flex flex-col justify-between p-6 text-white select-none animate-in fade-in duration-150">
      {/* Flashing Ambient Strobe */}
      <div className="absolute inset-0 bg-red-600/30 animate-pulse pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-rose-500/40 pb-4">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-8 h-8 text-rose-300 animate-bounce" />
          <div>
            <h1 className="text-xl font-black tracking-widest text-rose-100 uppercase">
              EMERGENCY DETERRENT SIREN
            </h1>
            <p className="text-xs text-rose-300">Audible Alarm Active · GPS Broadcast Transmitted</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Alert Details */}
      <div className="relative z-10 max-w-xl mx-auto w-full text-center space-y-4 py-8">
        <div className="text-5xl font-black font-mono tracking-tight text-white drop-shadow-lg">
          POLICE NOTIFIED
        </div>
        <div className="text-lg font-bold text-rose-200">
          CAB: {trip.driverVehicle} · {trip.plateNumber}
        </div>
        <div className="p-4 rounded-2xl bg-black/60 border border-rose-500 text-left font-mono text-xs space-y-1.5 text-rose-100">
          <div>PASSENGER: {trip.passengerName}</div>
          <div>LOCATION: {trip.currentLocation.address}</div>
          <div>COORDINATES: {trip.currentLocation.lat.toFixed(4)}, {trip.currentLocation.lng.toFixed(4)}</div>
          <div>RISK: {session.riskScore}/100 (CRITICAL EMERGENCY)</div>
        </div>
      </div>

      {/* Bottom Emergency Action Controls */}
      <div className="relative z-10 max-w-xl mx-auto w-full flex gap-3">
        <button
          onClick={() => alert('Dialing Police Control Room (112)...')}
          className="flex-1 py-4 px-4 rounded-2xl bg-white hover:bg-slate-100 text-rose-900 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer"
        >
          <PhoneCall className="w-5 h-5 text-rose-700" />
          Call 112 (Emergency)
        </button>

        <button
          onClick={() => {
            onMarkSafe();
            onClose();
          }}
          className="flex-1 py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer"
        >
          I am Safe (Disarm Siren)
        </button>
      </div>
    </div>
  );
};
