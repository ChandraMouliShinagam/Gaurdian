# GUARDIAN
### *"Stay with me when I can't ask anyone else."*

GUARDIAN is a real-time AI personal safety companion built for high-vulnerability moments when a solo traveler (such as a woman riding alone in a night cab) becomes uncomfortable, uneasy, or unsafe.

---

## Core Product Principle

```
+-------------------------------------------------------------+
|                     GEMINI UNDERSTANDS                      |
| (Live voice dialogue, vocal strain, whispering, tool calls) |
+-------------------------------------------------------------+
                              |
                              v [Tool Call Requests]
+-------------------------------------------------------------+
|                    SAFETY KERNEL DECIDES                    |
|  (Deterministic risk score, 10-min timeout, action gates)   |
+-------------------------------------------------------------+
```

1. **Gemini Understands**: Handles live bidirectional low-latency audio via `gemini-3.8-live`, senses acoustic whispering and tension, and requests safety actions via structured tool calls.
2. **The Safety Kernel Decides**: A deterministic state machine owns the 0–100 risk score, timers, and permissions. **The LLM never directly calls police or performs irreversible actions**—it requests; the Kernel authorizes.

---

## 3-Tier Model Architecture

| Layer | Model / Runtime | Responsibility |
|---|---|---|
| **Real-time Live Audio** | `gemini-3.8-live` | Natural conversational presence, barge-in interruption, tool calling |
| **Offline Edge Layer** | `Gemma 4 E2B` (Adapter) | Local continuity when cellular connectivity drops ("Losing network != losing safety") |
| **Forensic Evidence & Dossier** | `gemini-3.8-flash` | Structured screenshot/message analysis and official incident timeline generation |

---

## Cumulative Risk Model (0–100)

- **Route Deviation**: `+15`
- **Unexpected Stop**: `+20`
- **User Discomfort ("I'm uncomfortable")**: `+25`
- **User Fear**: `+30`
- **Cry for Help ("I need help")**: `+45`
- **Manual SOS**: `+60`
- **No Response after 10 simulated minutes**: `+20`
- **Repeated Anomalies**: `+10` each (capped at 30)

### States:
- `0–24`: **NORMAL** (Passive telemetry)
- `25–49`: **CONCERN** (Check-in initiated, timer armed)
- `50–74`: **ELEVATED** (Discreet mode ready, first contact standing by)
- `75–100`: **CRITICAL** (Level 1/2/3 emergency escalation ladder activated)

---

## Key Escalation Rule
If meaningful risk is established and Guardian initiates a check-in, **no response for 10 simulated minutes** automatically triggers **Level 1 Escalation** to Contact #1 (Sunita Sharma - Mom) with full GPS breadcrumb data. Explicit cries for help immediately bypass the waiting window.
