# GUARDIAN SYSTEM ARCHITECTURE

## 1. Full-Stack Topology

```
+------------------------------------------------------------------------+
|                     BROWSER CLIENT (React + TypeScript)                 |
|  - 16kHz PCM Little-Endian Mic Capture (AEC + Noise Suppression)       |
|  - 24kHz PCM Playback (Jitter Buffer Scheduling & Instant Barge-in)    |
|  - Command Center UI (Risk Gauge, Waveform, Route Telemetry, Timer)    |
|  - Covert Discreet Mode & Loud Deterrent Siren                         |
+------------------------------------------------------------------------+
                 |                                      |
       (WebSocket /api/live)                 (REST /api/gemini/*)
                 |                                      |
                 v                                      v
+------------------------------------------------------------------------+
|                      NODE.JS / EXPRESS SERVER                          |
|  - ai.live.connect({ model: "gemini-3.8-live" })                       |
|  - Safety Tools Definition (update_safety_signal, enter_discreet_mode) |
|  - Gemini 3.8 Flash Endpoints (/analyze-evidence, /incident-summary)   |
|  - Deterministic Safety Kernel State Sync                              |
+------------------------------------------------------------------------+
                 |
                 v
+------------------------------------------------------------------------+
|                   ON-DEVICE EDGE FALLBACK (Gemma 4 E2B)                 |
|  - Zero-cloud local command execution: "I need help", "I'm safe"       |
|  - Offline SMS dispatch queue & local timer continuity                 |
+------------------------------------------------------------------------+
```

## 2. Gemini 3.8 Live API Implementation
- Model: `gemini-3.8-live`
- Live Audio Format: Input 16kHz 16-bit mono little-endian PCM; output 24kHz PCM.
- System prompt instructs model to act as a calm, reassuring, low-profile passenger companion.
- Real-time Function Calling:
  - `update_safety_signal`: Maps perceived distress to Safety Kernel signals
  - `enter_discreet_mode`: Cuts voice output immediately on user request
  - `start_safety_timer` / `stop_safety_timer`: Manages check-in intervals
  - `prepare_trusted_contact_alert`: Prepares emergency packet for dispatch
