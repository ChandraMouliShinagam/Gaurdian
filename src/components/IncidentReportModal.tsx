/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, FileText, Download, ShieldCheck, Printer, AlertTriangle, Sparkles } from 'lucide-react';
import { SafetySession, TripTelemetry } from '../safety-kernel/types';
import { FlashAnalysisService, IncidentReportSummary } from '../services/flashAnalysisService';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SafetySession;
  trip: TripTelemetry;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  session,
  trip,
}) => {
  const [report, setReport] = useState<IncidentReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const rep = await FlashAnalysisService.generateIncidentReport(session, trip);
      setReport(rep);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Official Incident Timeline & Forensic Report
              </h2>
              <p className="text-xs text-slate-400">Structured reconstruction by Gemini 3.8 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs">
          {!report && !isLoading && (
            <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 font-sans">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
              <h3 className="font-semibold text-slate-200 text-sm">Generate Incident Summary Report</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Synthesize all recorded telemetry anomalies, audio signals, timestamps, and escalation history
                into an official forensic packet for law enforcement or trusted contacts.
              </p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Generate Report with Gemini 3.8 Flash
              </button>
            </div>
          )}

          {isLoading && (
            <div className="p-12 text-center text-slate-400 space-y-3 font-sans">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Reconstructing incident timeline and compiling dispatch dossier...</p>
            </div>
          )}

          {report && (
            <div className="space-y-4 text-slate-300">
              {/* Report Header */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-indigo-400 font-bold">
                  <span>INCIDENT REF: {report.incidentNumber}</span>
                  <span>STATUS: {session.riskState}</span>
                </div>
                <div>PASSENGER: Priya Sharma | CAB: {trip.plateNumber} ({trip.driverName})</div>
                <div>JOURNEY: {trip.origin} → {trip.destination}</div>
                <div>PEAK RISK SCORE: {session.riskScore}/100</div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-sans">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Executive Summary:
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{report.executiveSummary}</p>
              </div>

              {/* Timeline */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sequential Anomaly Timeline:
                </div>
                <div className="space-y-1.5">
                  {report.timeline.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 border-b border-slate-800/60 pb-1 text-[11px]">
                      <span className="text-indigo-400 shrink-0 font-bold">[{item.time}]</span>
                      <span className="flex-1 text-slate-200">{item.event}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          item.severity === 'HIGH' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dispatch Recommendation */}
              <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/40 space-y-1 font-sans">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                  Dispatch Recommendation:
                </div>
                <p className="text-xs text-slate-300">{report.dispatchRecommendation}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 font-sans">
                <button
                  onClick={() => alert('Dossier exported to PDF / Secure Evidence Vault.')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Signed Dossier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
