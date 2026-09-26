# GUARDIAN 10-SCENE HACKATHON DEMO GUIDE

Step through each scene using the **Demo Scenario Orchestrator** toolbar at the bottom of the screen or interact naturally with your microphone.

### Scene 1: Start Guardian
- **Action**: Click `#1 Start Ride`.
- **State**: Risk `0 / 100` (NORMAL). Telemetry shows Swift Dzire (TS 09 UB 4412) on corridor from Banjara Hills to Financial District.

### Scene 2: Natural Conversational Interaction
- **Action**: Click `#2 Natural Speech` or speak into your microphone: *"Hey Guardian, heading home."*
- **State**: Gemini Live responds conversationally in a calm, reassuring tone. Waveform animates with green pulse.

### Scene 3: Cross-Language Cab Bridge
- **Action**: Click `#3 Cross-Language`.
- **State**: Demonstrates multi-speaker detection (Speaker 0: Passenger Telugu/English, Speaker 1: Driver Hindi) with real-time interpretation.

### Scene 4: Route Deviation
- **Action**: Click `#4 Route Deviation`.
- **State**: Sensor telemetry injects a detour (+15 risk -> 15 NORMAL). Guardian automatically checks in: *"I noticed the route has changed from the highway to a service road. Are you okay, Priya?"*

### Scene 5: Unexpected Stop
- **Action**: Click `#5 Unexpected Stop`.
- **State**: Vehicle comes to a 0 km/h halt in an unlit sector (+20 risk -> 35 CONCERN). The 10-minute check-in countdown timer automatically arms.

### Scene 6: User Voiced Discomfort
- **Action**: Click `#6 Discomfort Voiced` or whisper *"I'm uncomfortable."*
- **State**: Whisper detected (+25 risk -> 60 ELEVATED). Companion matches tone and stages first contact.

### Scene 7: Barge-in & Discreet Mode
- **Action**: Click `#7 Barge-in Interrupt` or say: *"Don't say anything out loud."*
- **State**: Gemini cuts speech immediately! Screen enters Covert Discreet View (disguised as mundane everyday notes/expenses app with background timer running).

### Scene 8: 10-Minute Timeout Escalation
- **Action**: Click `#8 10-Min Timeout`.
- **State**: 10 simulated minutes expire with no passenger confirmation. Kernel applies +20 penalty (Risk 80 CRITICAL) and dispatches Level 1 Escalation. The simulated smartphone lockscreen of Sunita Sharma (Mom) opens with GPS coordinates.

### Scene 9: Network Lost (Offline Gemma 4)
- **Action**: Click `#9 Network Lost`.
- **State**: Cellular connectivity drops. The system transitions to `OFFLINE: Gemma 4 E2B`. Passenger says *"I need help."* The local edge kernel executes emergency actions 100% locally without cloud dependencies.

### Scene 10: Cloud Restored & Incident Dossier
- **Action**: Click `#10 Cloud Restored`.
- **State**: Cloud connectivity resumes. Offline events sync automatically. Gemini 3.8 Flash generates an authoritative post-incident forensic timeline and dossier for authorities.
