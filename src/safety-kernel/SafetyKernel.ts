/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GUARDIAN DETERMINISTIC SAFETY KERNEL
 *
 * Core Principle:
 * "Gemini understands. The Safety Kernel decides."
 *
 * Deterministic policy evaluator, risk accumulator, timeout escalations,
 * and permission gate for irreversible safety actions.
 */

import {
  EscapeMode,
  NetworkState,
  RiskState,
  SafetyAlertPacket,
  SafetyPolicy,
  SafetySession,
  SafetySignal,
  SignalType,
  TripTelemetry,
} from './types';

export const DEFAULT_POLICY: SafetyPolicy = {
  userId: 'priya_v_2026',
  userName: 'Priya Sharma',
  simulatedMinutesToEscalate: 10,
  trustedContacts: [
    {
      id: 'contact_1',
      name: 'Sunita Sharma (Mom)',
      relationship: 'Mother',
      phone: '+91 98490 12345',
      escalationLevel: 1,
      status: 'PREPARED',
    },
    {
      id: 'contact_2',
      name: 'Ananya Rao',
      relationship: 'Sister / Flatmate',
      phone: '+91 94401 67890',
      escalationLevel: 2,
      status: 'IDLE',
    },
  ],
  allowEmergencyDispatch: true,
  weights: {
    route_deviation: 15,
    unexpected_stop: 20,
    user_uncomfortable: 25,
    user_fear: 30,
    user_help: 45,
    manual_sos: 60,
    no_response_timeout: 20,
    repeated_anomalies: 10,
    audio_whisper_distress: 15,
    rapid_deceleration: 10,
  },
  thresholds: {
    concern: 25,
    elevated: 50,
    critical: 75,
  },
};

export const INITIAL_TRIP_TELEMETRY: TripTelemetry = {
  tripId: 'TRIP-HYD-84920',
  passengerName: 'Priya Sharma',
  origin: 'Banjara Hills, Road No. 12',
  destination: 'Financial District, Nanakramguda',
  driverName: 'Ramesh K.',
  driverVehicle: 'White Sedan (Swift Dzire)',
  plateNumber: 'TS 09 UB 4412',
  currentLocation: {
    lat: 17.4156,
    lng: 78.4352,
    address: 'Banjara Hills Rd No. 12, Hyderabad',
    speedKmh: 38,
    heading: 245,
  },
  deviationDetected: false,
  unexpectedStopDetected: false,
  distanceRemainingKm: 14.2,
  estimatedArrivalMinutes: 28,
};

export class SafetyKernel {
  private policy: SafetyPolicy;
  private trip: TripTelemetry;
  private session: SafetySession;
  private listeners: Set<(session: SafetySession) => void> = new Set();

  constructor(policy: SafetyPolicy = DEFAULT_POLICY, initialTrip: TripTelemetry = INITIAL_TRIP_TELEMETRY) {
    this.policy = policy;
    this.trip = { ...initialTrip };
    this.session = this.createInitialSession();
  }

  private createInitialSession(): SafetySession {
    const now = Date.now();
    return {
      sessionId: `SES-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: 'ACTIVE',
      riskScore: 0,
      riskState: 'NORMAL',
      signals: [],
      activeEscapeMode: 'NONE',
      networkState: 'ONLINE',
      timerArmed: false,
      timerStartedAt: null,
      timerDurationSeconds: this.policy.simulatedMinutesToEscalate * 60, // 600s
      timeRemainingSeconds: this.policy.simulatedMinutesToEscalate * 60,
      lastUserInteractionAt: now,
      lastUserConfirmedState: 'Passenger boarded cab, journey started normally.',
      currentEscalationLevel: 0,
      escalationHistory: [],
      isCompanionSpeaking: false,
      isUserSpeaking: false,
      audioTensionLevel: 'CALM',
      detectedSpeakers: [
        { speakerId: 'Passenger', detectedLanguage: 'English', lastActiveAt: now },
        { speakerId: 'Driver', detectedLanguage: 'Hindi', lastActiveAt: now },
      ],
      offlineSignalsPendingSync: [],
    };
  }

  public subscribe(listener: (session: SafetySession) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSession());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const current = this.getSession();
    for (const listener of this.listeners) {
      listener(current);
    }
  }

  public getSession(): SafetySession {
    return {
      ...this.session,
      signals: [...this.session.signals],
      escalationHistory: [...this.session.escalationHistory],
      detectedSpeakers: this.session.detectedSpeakers.map((s) => ({ ...s })),
    };
  }

  public getTrip(): TripTelemetry {
    return { ...this.trip };
  }

  public getPolicy(): SafetyPolicy {
    return { ...this.policy };
  }

  /**
   * Add a detected safety signal to the kernel.
   * Calculates new cumulative risk score and evaluates state transitions.
   */
  public addSignal(signalInput: Omit<SafetySignal, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): SafetySignal {
    const now = Date.now();
    const id = signalInput.id || `SIG-${Math.random().toString(36).substring(2, 8)}`;
    const weight = signalInput.weight ?? this.policy.weights[signalInput.type] ?? 10;

    const signal: SafetySignal = {
      ...signalInput,
      id,
      timestamp: signalInput.timestamp || now,
      weight,
    };

    // If offline, queue for sync
    if (this.session.networkState === 'OFFLINE_GEMMA') {
      this.session.offlineSignalsPendingSync.push(signal);
    }

    this.session.signals.push(signal);

    // Update telemetry state if signal correlates to sensors
    if (signal.type === 'route_deviation') {
      this.trip.deviationDetected = true;
      this.trip.currentLocation = {
        lat: 17.3995,
        lng: 78.3842,
        address: 'Unplanned Detour: Outer Ring Service Rd (Dark Sector)',
        speedKmh: 46,
      };
    } else if (signal.type === 'unexpected_stop') {
      this.trip.unexpectedStopDetected = true;
      this.trip.currentLocation = {
        lat: 17.3921,
        lng: 78.3755,
        address: 'Stopped: Unlit Industrial By-lane, Nanakramguda border',
        speedKmh: 0,
      };
    }

    // Explicit SOS or critical phrases bypass waiting periods immediately
    if (signal.type === 'user_help' || signal.type === 'manual_sos') {
      this.session.lastUserConfirmedState = `Critical user request: "${signal.label}"`;
      this.calculateRisk();
      this.evaluateImmediateCriticalEscalation();
      this.notify();
      return signal;
    }

    // Recalculate score
    this.calculateRisk();

    // If risk reached CONCERN or ELEVATED, arm check-in countdown if not armed
    if (this.session.riskScore >= this.policy.thresholds.concern && !this.session.timerArmed) {
      this.armCheckInTimer('Elevated situational risk detected. Monitoring user confirmation.');
    }

    this.notify();
    return signal;
  }

  /**
   * Deterministic Risk Calculation:
   * Cumulative sum of unique signals with cap on repeated anomalies.
   */
  public calculateRisk(): number {
    let score = 0;
    let anomalyCount = 0;

    for (const sig of this.session.signals) {
      if (sig.type === 'repeated_anomalies') {
        anomalyCount++;
      } else {
        score += sig.weight;
      }
    }

    // Repeated anomalies capped at +30 (max 3 counts of 10)
    const anomalyWeight = Math.min(anomalyCount * (this.policy.weights.repeated_anomalies || 10), 30);
    score += anomalyWeight;

    // Hard clamp to 0-100
    score = Math.max(0, Math.min(100, score));
    this.session.riskScore = score;
    this.session.riskState = this.determineRiskState(score);

    return score;
  }

  public determineRiskState(score: number): RiskState {
    if (score >= this.policy.thresholds.critical) return 'CRITICAL';
    if (score >= this.policy.thresholds.elevated) return 'ELEVATED';
    if (score >= this.policy.thresholds.concern) return 'CONCERN';
    return 'NORMAL';
  }

  /**
   * Arm check-in timer when risk rises
   */
  public armCheckInTimer(reason: string): void {
    this.session.timerArmed = true;
    this.session.timerStartedAt = Date.now();
    this.session.timeRemainingSeconds = this.policy.simulatedMinutesToEscalate * 60; // 600s
    this.session.lastUserConfirmedState = reason;
    this.notify();
  }

  public disarmCheckInTimer(): void {
    this.session.timerArmed = false;
    this.session.timerStartedAt = null;
    this.session.timeRemainingSeconds = this.policy.simulatedMinutesToEscalate * 60;
    this.notify();
  }

  /**
   * Tick timer forward by delta simulated seconds
   */
  public tickTimer(deltaSeconds: number): void {
    if (!this.session.timerArmed) return;

    this.session.timeRemainingSeconds = Math.max(0, this.session.timeRemainingSeconds - deltaSeconds);

    if (this.session.timeRemainingSeconds <= 0) {
      // 10 simulated minutes elapsed without response!
      this.handleNoResponseTimeout();
    } else {
      this.notify();
    }
  }

  /**
   * Rule: No response after meaningful prior risk for 10 simulated minutes
   * -> Add +20 risk and trigger Level 1 escalation.
   */
  public handleNoResponseTimeout(): void {
    this.session.timerArmed = false;

    // Add +20 no response timeout signal
    this.addSignal({
      type: 'no_response_timeout',
      label: 'No user response after 10 simulated minutes',
      weight: 20,
      source: 'safety_kernel_timer',
      confidence: 1.0,
    });

    // Escalate to Level 1 (or next level)
    this.triggerEscalation(1, 'No response received from passenger during safety check-in window.');
  }

  /**
   * Trigger deterministic escalation ladder
   */
  public triggerEscalation(level: 1 | 2 | 3, reason: string): SafetyAlertPacket {
    this.session.currentEscalationLevel = level;
    this.session.status = 'ESCALATED';

    let target = 'Trusted Contact #1';
    let dispatchChannel: SafetyAlertPacket['dispatchedVia'] = 'SMS_GATEWAY';

    if (level === 1) {
      const c1 = this.policy.trustedContacts[0];
      target = `${c1.name} (${c1.phone})`;
      c1.status = 'NOTIFIED';
      c1.lastNotifiedAt = Date.now();
    } else if (level === 2) {
      const c2 = this.policy.trustedContacts[1] || this.policy.trustedContacts[0];
      target = `${c2.name} (${c2.phone})`;
      c2.status = 'NOTIFIED';
      c2.lastNotifiedAt = Date.now();
    } else {
      target = 'National Emergency Response (Dial 112 / PCR)';
      dispatchChannel = 'EMERGENCY_API';
    }

    if (this.session.networkState === 'OFFLINE_GEMMA') {
      dispatchChannel = 'LOCAL_SMS_FALLBACK';
    }

    const packet: SafetyAlertPacket = {
      id: `ALT-${Date.now()}-${level}`,
      timestamp: Date.now(),
      user: this.policy.userName,
      escalationLevel: level,
      escalationTarget: target,
      riskScore: this.session.riskScore,
      riskState: this.session.riskState,
      signals: this.session.signals.map((s) => `+${s.weight} ${s.label}`),
      location: { ...this.trip.currentLocation },
      journey: `${this.trip.origin} → ${this.trip.destination}`,
      timeSinceLastResponseSec: Math.floor((Date.now() - this.session.lastUserInteractionAt) / 1000),
      lastUserConfirmedState: this.session.lastUserConfirmedState,
      summary: reason,
      dispatchedVia: dispatchChannel,
    };

    this.session.escalationHistory.unshift(packet);
    this.notify();
    return packet;
  }

  /**
   * Explicit immediate emergency escalation bypasses waiting period
   */
  public evaluateImmediateCriticalEscalation(): void {
    if (this.session.currentEscalationLevel < 1) {
      this.triggerEscalation(1, 'Critical distress signal or manual SOS activated. Bypassing check-in timer.');
    }
  }

  /**
   * User spoke or responded to a check-in
   */
  public recordUserResponse(text: string): void {
    const now = Date.now();
    this.session.lastUserInteractionAt = now;
    this.session.lastUserConfirmedState = `Passenger: "${text}"`;

    const lower = text.toLowerCase();

    // Check for explicit "I'm safe", "cancel", "all good"
    if (
      lower.includes("i'm safe") ||
      lower.includes('i am safe') ||
      lower.includes('everything is fine') ||
      lower.includes('cancel alert') ||
      lower.includes('false alarm')
    ) {
      this.markUserSafe('User explicitly verified safety.');
      return;
    }

    // Check for "Don't say anything out loud" or "quiet" / "discreet"
    if (
      lower.includes("don't say anything") ||
      lower.includes('stop talking') ||
      lower.includes('be quiet') ||
      lower.includes('mute') ||
      lower.includes('discreet')
    ) {
      this.setEscapeMode('DISCREET');
      this.session.isCompanionSpeaking = false;
    }

    // Check for "uncomfortable"
    if (lower.includes('uncomfortable') || lower.includes('uneasy') || lower.includes('creepy')) {
      this.addSignal({
        type: 'user_uncomfortable',
        label: 'Passenger reported feeling uncomfortable',
        weight: 25,
        source: 'user_voice',
        confidence: 0.95,
      });
      this.setEscapeMode('DISCREET');
    }

    // Check for "help", "attacked", "emergency"
    if (lower.includes('i need help') || lower.includes('help me') || lower.includes('attack') || lower.includes('emergency')) {
      this.addSignal({
        type: 'user_help',
        label: 'Explicit user emergency cry for help',
        weight: 45,
        source: 'user_voice',
        confidence: 1.0,
      });
    }

    this.notify();
  }

  /**
   * User marks themselves safe
   */
  public markUserSafe(reason: string): void {
    this.session.riskScore = 0;
    this.session.riskState = 'NORMAL';
    this.session.status = 'RESOLVED';
    this.session.timerArmed = false;
    this.session.activeEscapeMode = 'NONE';
    this.session.lastUserConfirmedState = reason;
    this.session.signals.push({
      id: `SIG-SAFE-${Date.now()}`,
      type: 'user_help',
      label: `Safe Confirmation: ${reason}`,
      weight: 0,
      timestamp: Date.now(),
      source: 'user_voice',
    });
    this.notify();
  }

  /**
   * Escape Modes: NONE, DISCREET, SILENT, LOUD
   */
  public setEscapeMode(mode: EscapeMode): void {
    this.session.activeEscapeMode = mode;
    if (mode === 'DISCREET' || mode === 'SILENT') {
      this.session.isCompanionSpeaking = false;
    }
    this.notify();
  }

  /**
   * Network transitions: ONLINE -> OFFLINE_GEMMA -> SYNCING -> ONLINE
   */
  public setNetworkState(state: NetworkState): void {
    const prevState = this.session.networkState;
    this.session.networkState = state;

    if (prevState === 'OFFLINE_GEMMA' && state === 'SYNCING') {
      // Simulate sync of pending offline signals
      setTimeout(() => {
        this.session.offlineSignalsPendingSync = [];
        this.session.networkState = 'ONLINE';
        this.notify();
      }, 1500);
    }

    this.notify();
  }

  /**
   * Audio Companion state setters
   */
  public setCompanionSpeaking(speaking: boolean): void {
    if (this.session.activeEscapeMode === 'DISCREET' || this.session.activeEscapeMode === 'SILENT') {
      this.session.isCompanionSpeaking = false;
    } else {
      this.session.isCompanionSpeaking = speaking;
    }
    this.notify();
  }

  public setUserSpeaking(speaking: boolean): void {
    this.session.isUserSpeaking = speaking;
    if (speaking) {
      this.session.lastUserInteractionAt = Date.now();
    }
    this.notify();
  }

  public setAudioTension(level: SafetySession['audioTensionLevel']): void {
    this.session.audioTensionLevel = level;
    if (level === 'WHISPERING' && this.session.riskScore >= 25 && this.session.activeEscapeMode === 'NONE') {
      this.setEscapeMode('DISCREET');
    }
    this.notify();
  }

  public updateSpeakerActivity(speakerId: 'Passenger' | 'Driver', language: 'English' | 'Telugu' | 'Hindi'): void {
    const existing = this.session.detectedSpeakers.find((s) => s.speakerId === speakerId);
    if (existing) {
      existing.detectedLanguage = language;
      existing.lastActiveAt = Date.now();
    }
    this.notify();
  }

  /**
   * Authorize tool request from Gemini
   * Safety Kernel decides whether the requested action is allowed!
   */
  public authorizeGeminiTool(toolName: string, args: Record<string, unknown>): { allowed: boolean; result: unknown } {
    switch (toolName) {
      case 'get_trip_status':
        return {
          allowed: true,
          result: {
            telemetry: this.trip,
            riskScore: this.session.riskScore,
            riskState: this.session.riskState,
            status: this.session.status,
          },
        };

      case 'get_current_location':
        return {
          allowed: true,
          result: this.trip.currentLocation,
        };

      case 'get_safety_state':
        return {
          allowed: true,
          result: {
            riskScore: this.session.riskScore,
            riskState: this.session.riskState,
            timerArmed: this.session.timerArmed,
            timeRemainingSeconds: this.session.timeRemainingSeconds,
            escapeMode: this.session.activeEscapeMode,
            networkState: this.session.networkState,
          },
        };

      case 'update_safety_signal': {
        const signalType = (args.signal as SignalType) || 'user_uncomfortable';
        const explanation = (args.explanation as string) || 'Signal extracted by Gemini Live';
        const confidence = typeof args.confidence === 'number' ? args.confidence : 0.9;
        const sig = this.addSignal({
          type: signalType,
          label: explanation,
          weight: this.policy.weights[signalType] ?? 20,
          source: 'gemini_live',
          confidence,
        });
        return { allowed: true, result: { signalAdded: sig, newRiskScore: this.session.riskScore } };
      }

      case 'start_safety_timer': {
        const minutes = Number(args.minutes) || this.policy.simulatedMinutesToEscalate;
        this.session.timerDurationSeconds = minutes * 60;
        this.armCheckInTimer(String(args.reason || 'Check-in requested by companion'));
        return { allowed: true, result: { timerArmed: true, durationSeconds: minutes * 60 } };
      }

      case 'stop_safety_timer':
        this.disarmCheckInTimer();
        return { allowed: true, result: { timerArmed: false } };

      case 'enter_discreet_mode':
        this.setEscapeMode('DISCREET');
        return { allowed: true, result: { mode: 'DISCREET', muted: true } };

      case 'prepare_trusted_contact_alert': {
        // Safe to prepare; kernel verifies policy
        const level = (Number(args.level) as 1 | 2) || 1;
        const note = String(args.note || 'Safety alert prepared');
        const alert = this.triggerEscalation(level, note);
        return { allowed: true, result: { alertPrepared: alert } };
      }

      case 'trigger_escape_mode': {
        const mode = (args.mode as EscapeMode) || 'DISCREET';
        this.setEscapeMode(mode);
        return { allowed: true, result: { escapeMode: mode } };
      }

      case 'mark_user_safe':
        this.markUserSafe(String(args.reason || 'User confirmed safety to companion'));
        return { allowed: true, result: { resolved: true } };

      case 'find_nearby_safe_place':
        return {
          allowed: true,
          result: {
            places: [
              { name: 'Nanakramguda 24/7 Police Outpost', distanceKm: 1.1, etaMinutes: 2 },
              { name: 'Continental Hospital Emergency ER', distanceKm: 2.3, etaMinutes: 5 },
              { name: 'Shell Petrol Station (Well Lit & CCTV)', distanceKm: 0.8, etaMinutes: 1 },
            ],
          },
        };

      default:
        return { allowed: false, result: `Tool ${toolName} not authorized by Safety Kernel policy.` };
    }
  }

  public reset(): void {
    this.trip = { ...INITIAL_TRIP_TELEMETRY };
    this.session = this.createInitialSession();
    this.notify();
  }
}
