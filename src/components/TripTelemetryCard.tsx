/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Navigation, Car, User, AlertTriangle, Compass, Gauge, AlertCircle } from 'lucide-react';
import { TripTelemetry } from '../safety-kernel/types';

interface TripTelemetryCardProps {
  telemetry: TripTelemetry;
  onInjectRouteDeviation: () => void;
  onInjectUnexpectedStop: () => void;
}

export const TripTelemetryCard: React.FC<TripTelemetryCardProps> = ({
  telemetry,
  onInjectRouteDeviation,
  onInjectUnexpectedStop,
}) => {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Ride & Route Telemetry</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {telemetry.tripId}
          </span>
        </div>
      </div>

      {/* Driver & Cab Details */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            <Car className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-200">{telemetry.driverVehicle}</div>
            <div className="text-[11px] font-mono text-indigo-400 font-bold">{telemetry.plateNumber}</div>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-200">{telemetry.driverName}</div>
            <div className="text-[11px] text-slate-400">Rating: 4.82 ★ · 1,420 trips</div>
          </div>
        </div>
      </div>

      {/* Route Journey Visualizer */}
      <div className="relative bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 mb-3">
        {/* Route Graph SVG Representation */}
        <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-900 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 360 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="routePlanned" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="routeDeviation" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="0" y1="25" x2="360" y2="25" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="360" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="0" y1="75" x2="360" y2="75" stroke="#1e293b" strokeDasharray="3 3" />

            {/* Planned Route Line (Highway Corridor) */}
            <path
              d="M 30,50 C 110,20 180,30 250,50 L 330,50"
              fill="none"
              stroke={telemetry.deviationDetected ? '#475569' : 'url(#routePlanned)'}
              strokeWidth="4"
              strokeDasharray={telemetry.deviationDetected ? '4 4' : 'none'}
            />

            {/* Actual Deviated Path if detected */}
            {telemetry.deviationDetected && (
              <path
                d="M 160,28 C 180,65 220,85 280,82"
                fill="none"
                stroke="url(#routeDeviation)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}

            {/* Origin Point */}
            <circle cx="30" cy="50" r="5" fill="#6366f1" />
            <text x="35" y="42" fill="#94a3b8" fontSize="9" fontWeight="bold">HOME</text>

            {/* Destination Point */}
            <circle cx="330" cy="50" r="5" fill="#10b981" />
            <text x="280" y="42" fill="#10b981" fontSize="9" fontWeight="bold">DESTINATION</text>

            {/* Current Position Marker */}
            {telemetry.deviationDetected ? (
              <g transform="translate(280, 82)">
                <circle cx="0" cy="0" r="8" fill="#ef4444" className="animate-ping opacity-75" />
                <circle cx="0" cy="0" r="6" fill="#ef4444" />
                <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                <text x="-40" y="-12" fill="#f87171" fontSize="9" fontWeight="bold">UNPLANNED DETOUR</text>
              </g>
            ) : (
              <g transform="translate(140, 26)">
                <circle cx="0" cy="0" r="7" fill="#6366f1" className="animate-ping opacity-60" />
                <circle cx="0" cy="0" r="5" fill="#6366f1" />
                <circle cx="0" cy="0" r="2" fill="#ffffff" />
              </g>
            )}

            {/* Unexpected Stop Marker if detected */}
            {telemetry.unexpectedStopDetected && (
              <g transform="translate(280, 82)">
                <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#b91c1c" stroke="#fca5a5" strokeWidth="1.5" />
                <text x="-32" y="22" fill="#fca5a5" fontSize="8" fontWeight="bold">0 KM/H STOPPED</text>
              </g>
            )}
          </svg>

          {/* Telemetry floating speed/heading hud */}
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-md text-[10px] font-mono text-slate-300">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-indigo-400" />
              {telemetry.currentLocation.speedKmh} km/h
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-400" />
              {telemetry.currentLocation.heading || 245}°
            </span>
          </div>
        </div>

        {/* Current Address & GPS breadcrumb */}
        <div className="mt-2.5 flex items-start gap-2 text-xs">
          <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${telemetry.deviationDetected ? 'text-rose-400' : 'text-indigo-400'}`} />
          <div className="flex-1">
            <div className="font-medium text-slate-200">{telemetry.currentLocation.address}</div>
            <div className="text-[11px] font-mono text-slate-500">
              GPS: {telemetry.currentLocation.lat.toFixed(4)}° N, {telemetry.currentLocation.lng.toFixed(4)}° E
            </div>
          </div>
        </div>

        {/* Deviation / Stop Alerts */}
        {telemetry.deviationDetected && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-amber-950/60 border border-amber-500/40 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Route Deviation: 1.8km off authorized highway trajectory.</span>
          </div>
        )}

        {telemetry.unexpectedStopDetected && (
          <div className="mt-1.5 flex items-center gap-2 p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
            <span>Unexpected Stationary Stop: Vehicle stationary for 4+ mins in unlit sector.</span>
          </div>
        )}
      </div>

      {/* Sensor Injection Buttons for Presenter */}
      <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={onInjectRouteDeviation}
          disabled={telemetry.deviationDetected}
          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          {telemetry.deviationDetected ? 'Deviation Injected ✓' : '+ Inject Route Deviation'}
        </button>

        <button
          onClick={onInjectUnexpectedStop}
          disabled={telemetry.unexpectedStopDetected}
          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          {telemetry.unexpectedStopDetected ? 'Stop Injected ✓' : '+ Inject Unexpected Stop'}
        </button>
      </div>
    </div>
  );
};
