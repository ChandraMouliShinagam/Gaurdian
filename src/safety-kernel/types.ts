/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GUARDIAN SAFETY KERNEL - TYPE DEFINITIONS
 * "Gemini understands. The Safety Kernel decides."
 */

export type RiskState = 'NORMAL' | 'CONCERN' | 'ELEVATED' | 'CRITICAL';

export type EscapeMode = 'NONE' | 'DISCREET' | 'SILENT' | 'LOUD';

export type NetworkState = 'ONLINE' | 'OFFLINE_GEMMA' | 'SYNCING';

export type SignalType =
  | 'route_deviation'
  | 'unexpected_stop'
  | 'user_uncomfortable'
  | 'user_fear'
  | 'user_help'
  | 'manual_sos'
  | 'no_response_timeout'
  | 'repeated_anomalies'
  | 'audio_whisper_distress'
  | 'rapid_deceleration';

export interface SafetySignal {
  id: string;
  type: SignalType;
  label: string;
  weight: number;
  timestamp: number;
  simulatedTimeOffsetMs?: number;
  confidence?: number;
  source: 'gemini_live' | 'sensor_telemetry' | 'user_voice' | 'user_manual' | 'safety_kernel_timer' | 'gemma_local';
  metadata?: Record<string, unknown>;
}

export interface TrustedContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  escalationLevel: 1 | 2;
  status: 'IDLE' | 'PREPARED' | 'NOTIFIED' | 'CONFIRMED';
  lastNotifiedAt?: number;
}

export interface SafetyPolicy {
  userId: string;
  userName: string;
  simulatedMinutesToEscalate: number; // default 10 minutes
  trustedContacts: TrustedContact[];
  allowEmergencyDispatch: boolean;
  weights: Record<SignalType, number>;
  thresholds: {
    concern: number; // 25
    elevated: number; // 50
    critical: number; // 75
  };
}

export interface TripLocation {
  lat: number;
  lng: number;
  address: string;
  heading?: number;
  speedKmh?: number;
}

export interface TripTelemetry {
  tripId: string;
  passengerName: string;
  origin: string;
  destination: string;
  driverName: string;
  driverVehicle: string;
  plateNumber: string;
  currentLocation: TripLocation;
  deviationDetected: boolean;
  unexpectedStopDetected: boolean;
  distanceRemainingKm: number;
  estimatedArrivalMinutes: number;
}

export interface SafetyAlertPacket {
  id: string;
  timestamp: number;
  user: string;
  escalationLevel: 1 | 2 | 3;
  escalationTarget: string; // e.g. "Mom (+91 98765 43210)"
  riskScore: number;
  riskState: RiskState;
  signals: string[];
  location: TripLocation;
  journey: string;
  timeSinceLastResponseSec: number;
  lastUserConfirmedState: string;
  summary: string;
  dispatchedVia: 'SMS_GATEWAY' | 'EMERGENCY_API' | 'LOCAL_SMS_FALLBACK';
}

export interface SafetySession {
  sessionId: string;
  status: 'ACTIVE' | 'DISCREET' | 'ESCALATED' | 'RESOLVED';
  riskScore: number;
  riskState: RiskState;
  signals: SafetySignal[];
  activeEscapeMode: EscapeMode;
  networkState: NetworkState;
  
  // Timer & Escalation
  timerArmed: boolean;
  timerStartedAt: number | null;
  timerDurationSeconds: number; // simulated seconds
  timeRemainingSeconds: number;
  lastUserInteractionAt: number;
  lastUserConfirmedState: string;
  currentEscalationLevel: 0 | 1 | 2 | 3;
  escalationHistory: SafetyAlertPacket[];
  
  // Audio & Companion State
  isCompanionSpeaking: boolean;
  isUserSpeaking: boolean;
  audioTensionLevel: 'CALM' | 'TENSE' | 'WHISPERING' | 'DISTRESSED';
  detectedSpeakers: {
    speakerId: 'Passenger' | 'Driver';
    detectedLanguage: 'English' | 'Telugu' | 'Hindi';
    lastActiveAt: number;
  }[];
  
  // Offline sync queue
  offlineSignalsPendingSync: SafetySignal[];
}
