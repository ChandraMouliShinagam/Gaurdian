/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, FileText, Upload, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { EvidenceAnalysisResult, FlashAnalysisService } from '../services/flashAnalysisService';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignal: (result: EvidenceAnalysisResult) => void;
}

const PRESET_EVIDENCES = [
  {
    id: 'preset_1',
    title: 'Suspicious Driver WhatsApp Message',
    type: 'Chat Screenshot',
    text: 'Driver: "Madam cancel the ride on the app right now. Pay me directly 1000 cash. Main road is blocked, we will go through interior quarry road. Are you alone?"',
  },
  {
    id: 'preset_2',
    title: 'Off-Grid Navigation Route Capture',
    type: 'GPS Detour Capture',
    text: 'Navigation map screenshot: Car deviates 3.4km away from Outer Ring Road into unlit dirt canal service track. Cellular coverage dropped to 1 bar.',
  },
  {
    id: 'preset_3',
    title: 'Verbal Audio Transcription Anomaly',
    type: 'In-Cabin Acoustic Snippet',
    text: 'Driver phone conversation overheard in cabin: "Haan bhai, gaadi side mein lagaya hoon. Passenger akeli hai. Tu chowk pe wait kar."',
  },
];

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ isOpen, onClose, onApplySignal }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_EVIDENCES[0].id);
  const [customText, setCustomText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EvidenceAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPreset = PRESET_EVIDENCES.find((p) => p.id === selectedPreset);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    const textToAnalyze = customText.trim() || currentPreset?.text || '';

    try {
      const result = await FlashAnalysisService.analyzeEvidence({
        textContent: textToAnalyze,
        evidenceType: currentPreset?.type || 'Forensic Digital Capture',
      });
      setAnalysisResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evidence analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommitToSafetyKernel = () => {
    if (analysisResult) {
      onApplySignal(analysisResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Gemini 3.8 Flash Evidence Vault</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  EVENT-DRIVEN ANALYSIS
                </span>
              </h2>
              <p className="text-xs text-slate-400">Extracts structured threat signals from screenshots or messages</p>
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
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Preset Evidence Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Forensic Evidence Sample or Enter Custom Text:
            </label>
            <div className="space-y-2">
              {PRESET_EVIDENCES.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPreset(p.id);
                    setCustomText('');
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedPreset === p.id && !customText
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between font-semibold mb-1">
                    <span>{p.title}</span>
                    <span className="text-[10px] font-mono text-indigo-400">{p.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic line-clamp-2">{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Textarea */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Or paste text from suspicious notification / SMS:
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Driver demanded I get out in the middle of an unlit forest road..."
              className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing with Gemini 3.8 Flash...' : 'Run Multimodal Analysis'}
            </button>
            <span className="text-[11px] text-slate-500 font-mono">Model: gemini-3.8-flash</span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Structured Analysis Results */}
          {analysisResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Structured Forensic Output
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    analysisResult.threatLevel === 'HIGH' || analysisResult.threatLevel === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                      : 'bg-yellow-950 text-yellow-300 border-yellow-500/50'
                  }`}
                >
                  {analysisResult.threatLevel} THREAT
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{analysisResult.summary}</p>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Detected Signals:</span>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.signals.map((sig, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60"
                    >
                      +{sig}
                    </span>
                  ))}
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold">
                    Risk Delta: +{analysisResult.riskDelta}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <strong className="text-slate-300">Recommended Action:</strong> {analysisResult.recommendedAction}
              </div>

              {/* Commit Signal to Safety Kernel */}
              <button
                onClick={handleCommitToSafetyKernel}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <span>Commit Evidence (+{analysisResult.riskDelta} Risk) to Safety Kernel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
