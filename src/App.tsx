/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GUARDIAN - AI SAFETY COMPANION
 * "Stay with me when I can't ask anyone else."
 *
 * Primary Hackathon Scenario:
 * Woman travelling alone in a cab (Priya Sharma).
 *
 * Architecture:
 * - Gemini 3.8 Live: Real-time bidirectional voice companion with barge-in & tool calls
 * - Deterministic Safety Kernel: Cumulative risk score (0-100), timers, escalations, permission gate
 * - Gemma 4 E2B: Local edge safety adapter for offline resilience
 * - Gemini 3.8 Flash: Event-driven evidence and structured incident documentation
 */

import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { RiskGauge } from './components/RiskGauge';
import { AudioVisualizer } from './components/AudioVisualizer';
import { TripTelemetryCard } from './components/TripTelemetryCard';
import { EscalationLadderCard } from './components/EscalationLadderCard';
import { LiveAudioContextPanel } from './components/LiveAudioContextPanel';
import { TrustedContactModal } from './components/TrustedContactModal';
import { EvidenceModal } from './components/EvidenceModal';
import { IncidentReportModal } from './components/IncidentReportModal';
import { DemoScenarioBar } from './components/DemoScenarioBar';
import { DiscreetCovertView } from './components/DiscreetCovertView';
import { LoudAlarmOverlay } from './components/LoudAlarmOverlay';
import { SafetyKernel } from './safety-kernel/SafetyKernel';
import { EscapeMode, NetworkState, SafetySession, TripTelemetry } from './safety-kernel/types';
import { GeminiLiveClient } from './services/geminiLiveClient';
import { Gemma4LocalAdapter } from './services/gemmaLocalAdapter';
import { EvidenceAnalysisResult } from './services/flashAnalysisService';

// Singleton Safety Kernel & Local Adapter
const safetyKernel = new SafetyKernel();
const gemmaAdapter = new Gemma4LocalAdapter(safetyKernel);

export default function App() {
  const [session, setSession] = useState<SafetySession>(safetyKernel.getSession());
  const [trip, setTrip] = useState<TripTelemetry>(safetyKernel.getTrip());
  const policy = safetyKernel.getPolicy();

  // Audio & Client State
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSimulationFast, setIsSimulationFast] = useState(true); // 1 real sec = 1 simulated min
  const [currentScene, setCurrentScene] = useState<number>(1);

  // Modals & Overlays
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isIncidentReportOpen, setIsIncidentReportOpen] = useState(false);

  const liveClientRef = useRef<GeminiLiveClient | null>(null);

  // 1. Subscribe to Safety Kernel updates
  useEffect(() => {
    const unsubscribe = safetyKernel.subscribe((newSession) => {
      setSession(newSession);
      setTrip(safetyKernel.getTrip());
    });
    return () => unsubscribe();
  }, []);

  // 2. Initialize Gemini Live client
  useEffect(() => {
    const client = new GeminiLiveClient({
      onConnected: (model) => {
        setIsLiveConnected(true);
      },
      onDisconnected: () => {
        setIsLiveConnected(false);
      },
      onError: (err) => {
        console.warn('Live API event:', err);
      },
      onCompanionSpeakingChange: (speaking) => {
        safetyKernel.setCompanionSpeaking(speaking);
      },
      onUserSpeakingChange: (speaking) => {
        safetyKernel.setUserSpeaking(speaking);
      },
      onInterrupted: () => {
        // User interrupted the model!
        safetyKernel.setCompanionSpeaking(false);
      },
      onToolCall: (toolName, args) => {
        // Safety Kernel authorizes tool
        safetyKernel.authorizeGeminiTool(toolName, args);
      },
      onAudioLevel: (level, source) => {
        if (source === 'user') {
          setAudioLevel(level);
        }
      },
    });

    liveClientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  // 3. Safety Timer Tick Loop
  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (session.timerArmed) {
        // If simulation mode: 1 real second = 60 simulated seconds (1 minute)
        // If real-time mode: 1 real second = 1 simulated second
        const delta = isSimulationFast ? 60 : 1;
        safetyKernel.tickTimer(delta);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [session.timerArmed, isSimulationFast]);

  // Speech Helper (Works for Live voice or fallback synthesis)
  const speakCompanionMessage = (text: string) => {
    if (session.activeEscapeMode === 'DISCREET' || session.activeEscapeMode === 'SILENT') {
      return;
    }

    if (session.networkState === 'OFFLINE_GEMMA') {
      gemmaAdapter.speakLocally(text);
      return;
    }

    if (liveClientRef.current) {
      liveClientRef.current.injectTextPrompt(
        `Say this to Priya immediately in a calming, reassuring companion voice: "${text}"`,
      );
    }

    // Also fallback browser speech if Live model audio is unavailable
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.0;
        u.pitch = 1.05;
        u.onstart = () => safetyKernel.setCompanionSpeaking(true);
        u.onend = () => safetyKernel.setCompanionSpeaking(false);
        window.speechSynthesis.speak(u);
      } catch (e) {
        // ignore
      }
    }
  };

  // User Voice Simulation Helper
  const handleSimulateVoiceUtterance = (text: string) => {
    if (session.networkState === 'OFFLINE_GEMMA') {
      const result = gemmaAdapter.processLocalCommand(text);
      if (result.localResponseAudioText) {
        speakCompanionMessage(result.localResponseAudioText);
      }
      return;
    }

    // Live Voice: Let Safety Kernel parse and execute
    safetyKernel.recordUserResponse(text);

    // If online, send prompt to Gemini Live so it responds conversationally
    if (liveClientRef.current && session.activeEscapeMode !== 'DISCREET' && session.activeEscapeMode !== 'SILENT') {
      liveClientRef.current.injectTextPrompt(`Passenger Priya just said: "${text}". Respond conversationally.`);
    }
  };

  // Demo 10-Scene Story Orchestrator
  const handleSelectScene = (sceneId: number) => {
    setCurrentScene(sceneId);

    switch (sceneId) {
      case 1: {
        // SCENE 1: User starts Guardian (Home -> Destination, Risk 0, NORMAL)
        safetyKernel.reset();
        safetyKernel.setNetworkState('ONLINE');
        break;
      }

      case 2: {
        // SCENE 2: Natural Speech conversation
        safetyKernel.recordUserResponse("Hey Guardian, I'm heading home from Banjara Hills.");
        speakCompanionMessage("I'm right here with you, Priya. Route to Financial District is mapped. Ride safe.");
        break;
      }

      case 3: {
        // SCENE 3: Driver Hindi / Passenger Telugu-English dialogue
        safetyKernel.updateSpeakerActivity('Passenger', 'English');
        safetyKernel.updateSpeakerActivity('Driver', 'Hindi');
        speakCompanionMessage("I am monitoring both Telugu and Hindi in the cabin. The driver's tone is neutral.");
        break;
      }

      case 4: {
        // SCENE 4: Route Deviation (+15 Risk -> 15)
        safetyKernel.addSignal({
          type: 'route_deviation',
          label: 'Route deviation (+1.8km off highway)',
          weight: 15,
          source: 'sensor_telemetry',
        });
        speakCompanionMessage("I noticed the route has changed from the highway to a service road. Are you okay, Priya?");
        break;
      }

      case 5: {
        // SCENE 5: Unexpected Stop (+20 Risk -> 35 CONCERN)
        safetyKernel.addSignal({
          type: 'unexpected_stop',
          label: 'Unexpected stationary stop in dark sector',
          weight: 20,
          source: 'sensor_telemetry',
        });
        speakCompanionMessage("The car has stopped unexpectedly in an unlit sector. I've armed our safety timer.");
        break;
      }

      case 6: {
        // SCENE 6: User Discomfort (+25 Risk -> 60 ELEVATED)
        safetyKernel.setAudioTension('WHISPERING');
        safetyKernel.recordUserResponse("I'm feeling really uncomfortable with how this driver is acting.");
        speakCompanionMessage("I hear you, Priya. I'm right here. Whisper if you need to. First contact is standing by.");
        break;
      }

      case 7: {
        // SCENE 7: Barge-in Interrupt -> Immediately silence voice & lock Discreet Mode!
        if (liveClientRef.current) {
          liveClientRef.current.stopPlayback();
        }
        safetyKernel.recordUserResponse("Don't say anything out loud. Keep quiet.");
        safetyKernel.setEscapeMode('DISCREET');
        break;
      }

      case 8: {
        // SCENE 8: No response for 10 simulated minutes -> Level 1 Escalation (+20 Risk -> 80 CRITICAL)
        safetyKernel.handleNoResponseTimeout();
        setIsContactModalOpen(true);
        break;
      }

      case 9: {
        // SCENE 9: Network Lost -> Transition to Gemma 4 Local Safety Mode
        safetyKernel.setNetworkState('OFFLINE_GEMMA');
        const res = gemmaAdapter.processLocalCommand('I need help right now!');
        if (res.localResponseAudioText) {
          gemmaAdapter.speakLocally(res.localResponseAudioText);
        }
        break;
      }

      case 10: {
        // SCENE 10: Network Restored -> Sync Session -> Cloud Mode Restored
        safetyKernel.setNetworkState('SYNCING');
        setTimeout(() => {
          setIsIncidentReportOpen(true);
        }, 1600);
        break;
      }

      default:
        break;
    }
  };

  // Toggle network offline / online for testing Gemma 4
  const handleToggleNetwork = () => {
    if (session.networkState === 'ONLINE') {
      safetyKernel.setNetworkState('OFFLINE_GEMMA');
    } else {
      safetyKernel.setNetworkState('SYNCING');
    }
  };

  // Handle Flash Evidence result
  const handleApplyEvidenceSignal = (res: EvidenceAnalysisResult) => {
    safetyKernel.addSignal({
      type: 'user_uncomfortable',
      label: `[Gemini 3.8 Flash] ${res.summary}`,
      weight: res.riskDelta,
      source: 'gemini_live',
      confidence: res.confidence || 0.94,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* 1. Header */}
      <Header
        riskState={session.riskState}
        networkState={session.networkState}
        escapeMode={session.activeEscapeMode}
        isLiveConnected={isLiveConnected}
        isCompanionSpeaking={session.isCompanionSpeaking}
        isSimulationFast={isSimulationFast}
        onToggleFastSimulation={() => setIsSimulationFast(!isSimulationFast)}
        onSelectEscapeMode={(mode) => safetyKernel.setEscapeMode(mode)}
        onToggleNetwork={handleToggleNetwork}
        onOpenEvidenceModal={() => setIsEvidenceModalOpen(true)}
        onOpenIncidentReport={() => setIsIncidentReportOpen(true)}
        onMarkSafe={() => safetyKernel.markUserSafe('Passenger confirmed safety in command center.')}
      />

      {/* 2. Main Command Center Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 py-4 flex-1">
        {/* Urgent Alert Banner if CRITICAL or ESCALATED */}
        {session.status === 'ESCALATED' && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-950/70 border-2 border-rose-500 text-rose-100 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <div>
                <div className="font-extrabold text-sm uppercase tracking-wider text-rose-200">
                  ESCALATION ACTIVE · LEVEL {session.currentEscalationLevel}
                </div>
                <div className="text-xs text-rose-300">
                  Alert packet dispatched to {policy.trustedContacts[0].name} ({policy.trustedContacts[0].phone})
                  with live GPS coordinates and recorded signals.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                View Dispatched Alert
              </button>
              <button
                onClick={() => safetyKernel.markUserSafe('User disarmed escalation.')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 cursor-pointer"
              >
                Disarm (I'm Safe)
              </button>
            </div>
          </div>
        )}

        {/* Command Center 4-Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Risk Gauge & Audio Visualizer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Risk Gauge */}
            <RiskGauge
              riskScore={session.riskScore}
              riskState={session.riskState}
              signals={session.signals}
              onAddManualSOS={() => {
                safetyKernel.addSignal({
                  type: 'manual_sos',
                  label: 'Manual Passenger Emergency SOS button triggered',
                  weight: 60,
                  source: 'user_manual',
                  confidence: 1.0,
                });
              }}
            />

            {/* Live Audio Visualizer & Voice Simulation */}
            <AudioVisualizer
              session={session}
              audioLevel={audioLevel}
              isMicMuted={isMicMuted}
              onToggleMicMute={() => {
                setIsMicMuted(!isMicMuted);
                if (liveClientRef.current) {
                  liveClientRef.current.setMuted(!isMicMuted);
                }
              }}
              onSimulateVoiceUtterance={handleSimulateVoiceUtterance}
            />
          </div>

          {/* Right Column: Telemetry & Escalation Ladder (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Trip Telemetry & Map Visualizer */}
            <TripTelemetryCard
              telemetry={trip}
              onInjectRouteDeviation={() => {
                safetyKernel.addSignal({
                  type: 'route_deviation',
                  label: 'Route deviation off planned highway (+15)',
                  weight: 15,
                  source: 'sensor_telemetry',
                });
                speakCompanionMessage("I noticed the route has changed. Are you okay, Priya?");
              }}
              onInjectUnexpectedStop={() => {
                safetyKernel.addSignal({
                  type: 'unexpected_stop',
                  label: 'Unexpected stop in unlit industrial by-lane (+20)',
                  weight: 20,
                  source: 'sensor_telemetry',
                });
                speakCompanionMessage("I noticed the car has stopped in an unfamiliar spot. How are you feeling?");
              }}
            />

            {/* Escalation Ladder & 10-Minute Timeout Timer */}
            <EscalationLadderCard
              session={session}
              policy={policy}
              isSimulationFast={isSimulationFast}
              onFastForwardTimeout={() => safetyKernel.handleNoResponseTimeout()}
              onOpenAlertPreview={() => setIsContactModalOpen(true)}
              onMarkSafe={() => safetyKernel.markUserSafe('Confirmed safe.')}
              onTriggerManualEscalation={(level) =>
                safetyKernel.triggerEscalation(level, 'Manual escalation triggered by user command.')
              }
            />

            {/* Live Acoustic & Speaker Context */}
            <LiveAudioContextPanel
              session={session}
              onSimulateSpeakerTurn={(speaker, lang, text) => {
                safetyKernel.updateSpeakerActivity(speaker, lang);
                if (speaker === 'Driver') {
                  speakCompanionMessage(
                    "Driver said in Hindi: 'The road ahead is blocked, taking an alternative bypass.' Stay calm, I'm tracking our location.",
                  );
                }
              }}
            />
          </div>
        </div>
      </main>

      {/* 3. Demo Scenario Orchestrator Toolbar */}
      <DemoScenarioBar
        currentScene={currentScene}
        onSelectScene={handleSelectScene}
        onResetDemo={() => handleSelectScene(1)}
      />

      {/* 4. Modals & Overlays */}
      {/* Discreet Mode Covert Screen */}
      {session.activeEscapeMode === 'DISCREET' && (
        <DiscreetCovertView
          session={session}
          trip={trip}
          onExitDiscreetMode={() => safetyKernel.setEscapeMode('NONE')}
          onTriggerDiscreetEmergency={() => {
            safetyKernel.triggerEscalation(1, 'Silent discreet emergency triggered from covert view.');
            setIsContactModalOpen(true);
          }}
        />
      )}

      {/* Loud Siren Alarm Overlay */}
      {session.activeEscapeMode === 'LOUD' && (
        <LoudAlarmOverlay
          isOpen={true}
          onClose={() => safetyKernel.setEscapeMode('NONE')}
          session={session}
          trip={trip}
          onMarkSafe={() => safetyKernel.markUserSafe('Passenger disarmed siren alarm.')}
        />
      )}

      {/* Trusted Contact Lockscreen Modal */}
      <TrustedContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        session={session}
        policy={policy}
        trip={trip}
        onMarkSafe={() => safetyKernel.markUserSafe('Passenger confirmed safe.')}
      />

      {/* Gemini 3.8 Flash Evidence Vault Modal */}
      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        onApplySignal={handleApplyEvidenceSignal}
      />

      {/* Gemini 3.8 Flash Official Incident Report Modal */}
      <IncidentReportModal
        isOpen={isIncidentReportOpen}
        onClose={() => setIsIncidentReportOpen(false)}
        session={session}
        trip={trip}
      />
    </div>
  );
}
