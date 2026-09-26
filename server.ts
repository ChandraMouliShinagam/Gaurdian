/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GUARDIAN FULL-STACK SERVER
 *
 * Provides:
 * 1. Express API endpoints (/api/gemini/*, /api/health)
 * 2. WebSocket bridge for Gemini 3.8 Live API real-time bidirectional audio & function calling
 * 3. Vite development middleware integration
 */

import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebSocket, WebSocketServer } from 'ws';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '15mb' }));

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live' });

// Initialize official Google GenAI SDK on server-side only
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Define tools for Gemini 3.8 Live function calling
const safetyFunctionDeclarations = [
  {
    name: 'update_safety_signal',
    description: 'Report or record a safety-relevant observation, emotion, or user statement detected in conversation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        signal: {
          type: Type.STRING,
          description: 'Signal type: user_uncomfortable, user_fear, user_help, route_deviation, unexpected_stop, audio_whisper_distress',
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence score between 0.0 and 1.0',
        },
        explanation: {
          type: Type.STRING,
          description: 'Brief factual explanation of what was heard or noticed',
        },
      },
      required: ['signal', 'confidence', 'explanation'],
    },
  },
  {
    name: 'get_trip_status',
    description: 'Get current route, speed, destination, and vehicle telemetry.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_current_location',
    description: 'Get current GPS coordinates and street address of the passenger.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_safety_state',
    description: 'Get current risk score (0-100), state (NORMAL, CONCERN, ELEVATED, CRITICAL), and active mode.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'start_safety_timer',
    description: 'Start or re-arm check-in safety countdown timer when passenger is uneasy or risk is elevated.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        minutes: {
          type: Type.NUMBER,
          description: 'Minutes before escalation if no response (default 10)',
        },
        reason: {
          type: Type.STRING,
          description: 'Reason for arming check-in timer',
        },
      },
    },
  },
  {
    name: 'stop_safety_timer',
    description: 'Disarm countdown timer when passenger confirms safety.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'enter_discreet_mode',
    description: 'Mute companion voice immediately and switch into discreet / stealth monitoring mode when passenger wants discreet operation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: {
          type: Type.STRING,
          description: 'Reason for going discreet',
        },
      },
    },
  },
  {
    name: 'prepare_trusted_contact_alert',
    description: 'Request Safety Kernel to prepare an alert packet for trusted contacts or emergency ladder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.NUMBER,
          description: 'Escalation level (1 for Primary Contact, 2 for Secondary, 3 for Emergency)',
        },
        note: {
          type: Type.STRING,
          description: 'Context note to include in alert packet',
        },
      },
    },
  },
  {
    name: 'trigger_escape_mode',
    description: 'Activate specific escape mode: DISCREET, SILENT, or LOUD',
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: {
          type: Type.STRING,
          description: 'Mode: DISCREET, SILENT, or LOUD',
        },
      },
      required: ['mode'],
    },
  },
  {
    name: 'mark_user_safe',
    description: 'Confirm passenger is safe, disarm alert state, reset risk score to normal.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: {
          type: Type.STRING,
          description: 'Reason passenger is safe',
        },
      },
    },
  },
  {
    name: 'find_nearby_safe_place',
    description: 'Search for nearest police outpost, well-lit 24/7 petrol station, or hospital emergency room.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

const GUARDIAN_SYSTEM_INSTRUCTION = `You are GUARDIAN, an AI real-time personal safety companion for solo travelers.
Currently, you are riding along with Priya Sharma in a cab at night in Hyderabad (Banjara Hills to Financial District).
Your primary role is to stay with Priya, talk naturally, and ensure her safety.

CORE RULES:
1. Speak in a calm, reassuring, gentle voice. Keep spoken responses short (1-2 sentences) so the passenger can easily talk back or interrupt.
2. Perception: If Priya whispers or speaks quietly, keep your voice low and discreet.
3. Crucial Interruption Rule: If Priya says "Don't say anything out loud", "be quiet", "stop talking", or "shut up", call the tool 'enter_discreet_mode' immediately and DO NOT speak aloud again unless explicitly addressed in a safe manner.
4. When telemetry changes occur (e.g. route deviation, sudden unexpected stop) or Priya expresses feeling uncomfortable, check in with care:
   "I noticed the route has changed. Are you okay, Priya?"
   "I noticed the car has stopped in an unfamiliar spot. How are you feeling?"
5. When Priya expresses fear, discomfort, or asks for help, call 'update_safety_signal' so the deterministic Safety Kernel can register the signal and evaluate risk.
6. The deterministic Safety Kernel makes all safety decisions and manages escalation ladders. You are her companion, ears, and sensor interpreter.`;

// WebSocket Connection Handler for Gemini 3.8 Live
wss.on('connection', async (clientWs: WebSocket) => {
  let liveSession: any = null;
  let isClosed = false;

  clientWs.send(JSON.stringify({ type: 'server_ready', timestamp: Date.now(), hasApiKey: Boolean(apiKey) }));

  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'gemini_status',
        connected: false,
        error: 'GEMINI_API_KEY environment variable not configured on server.',
      }),
    );
    return;
  }

  try {
    // Connect to Gemini 3.8 Live via official SDK
    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
        systemInstruction: GUARDIAN_SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: safetyFunctionDeclarations as any }],
      },
      callbacks: {
        onopen: () => {
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'live_connected', model: 'gemini-3.8-live' }));
          }
        },
        onmessage: async (message: any) => {
          if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Model Audio Output
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }

          // 2. Interruption / Barge-in
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          // 3. Model Turn Complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }

          // 4. Function Call / Tool Call
          if (message.toolCall) {
            const functionCalls = message.toolCall.functionCalls;
            if (Array.isArray(functionCalls) && functionCalls.length > 0) {
              const responses: any[] = [];
              for (const call of functionCalls) {
                // Forward function call to client so Safety Kernel executes it
                clientWs.send(
                  JSON.stringify({
                    type: 'tool_call',
                    name: call.name,
                    id: call.id,
                    args: call.args,
                  }),
                );

                // Provide immediate affirmative response back to Live model
                responses.push({
                  id: call.id,
                  name: call.name,
                  response: {
                    acknowledged: true,
                    timestamp: Date.now(),
                    status: 'authorized_by_safety_kernel',
                  },
                });
              }

              try {
                await liveSession.sendToolResponse({ functionResponses: responses });
              } catch (toolErr) {
                console.error('Error sending tool response to Gemini Live:', toolErr);
              }
            }
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live session error:', err);
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'live_error', error: err?.message || String(err) }));
          }
        },
        onclose: () => {
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'live_closed' }));
          }
        },
      },
    });
  } catch (err: any) {
    console.error('Failed to initiate Gemini Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'live_error',
          error: `Could not connect to Gemini Live: ${err.message || String(err)}`,
        }),
      );
    }
  }

  // Handle messages from client
  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const payload = JSON.parse(data.toString());

      // Client sends raw PCM audio (16kHz 16-bit mono little-endian)
      if (payload.type === 'realtime_audio' && payload.audio && liveSession) {
        liveSession.sendRealtimeInput({
          audio: {
            data: payload.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      }

      // Client sends synthetic telemetry event (e.g., scene injection)
      if (payload.type === 'inject_text_prompt' && payload.text && liveSession) {
        liveSession.sendRealtimeInput({
          text: payload.text,
        });
      }

      // Client executes tool response manual confirmation
      if (payload.type === 'tool_response' && payload.functionResponses && liveSession) {
        liveSession.sendToolResponse({
          functionResponses: payload.functionResponses,
        });
      }
    } catch (parseErr) {
      console.warn('Error parsing incoming WebSocket message:', parseErr);
    }
  });

  clientWs.on('close', () => {
    isClosed = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    liveModel: 'gemini-3.8-live',
    flashModel: 'gemini-3.8-flash',
    edgeFallback: 'Gemma 4 E2B',
  });
});

// Gemini 3.8 Flash Endpoint: Structured Evidence Analysis
app.post('/api/gemini/analyze-evidence', async (req, res) => {
  try {
    const { imageBase64, textContent, evidenceType } = req.body;

    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const parts: any[] = [];

    if (imageBase64) {
      // Clean data URI prefix if present
      const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: cleanData,
        },
      });
    }

    const promptText = `Analyze this digital evidence for a passenger safety investigation.
Evidence type: ${evidenceType || 'Screenshot / Message / Navigation Detour'}.
Additional context provided: ${textContent || 'Passenger in cab at night experiencing discomfort.'}

Provide a structured forensic safety assessment including detected threat indicators, risk delta (+0 to +30), summary, and recommended immediate action.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            signals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific forensic safety signals (e.g. threat, coercion, route_deviation, suspicious_communication)',
            },
            riskDelta: {
              type: Type.NUMBER,
              description: 'Recommended additional risk score increase between 0 and 30',
            },
            threatLevel: {
              type: Type.STRING,
              description: 'Severity: LOW, MEDIUM, HIGH, CRITICAL',
            },
            summary: {
              type: Type.STRING,
              description: 'Clear, scannable forensic summary of the evidence',
            },
            recommendedAction: {
              type: Type.STRING,
              description: 'Recommended next step for Safety Kernel (e.g. preserve_evidence, trigger_level_1_alert, discreet_mode)',
            },
          },
          required: ['signals', 'riskDelta', 'threatLevel', 'summary', 'recommendedAction'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (err: any) {
    console.error('Evidence analysis error:', err);
    return res.status(500).json({ error: err.message || 'Evidence analysis failed' });
  }
});

// Gemini 3.8 Flash Endpoint: Official Incident Timeline Generation
app.post('/api/gemini/incident-summary', async (req, res) => {
  try {
    const { session, trip } = req.body;

    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const prompt = `You are a forensic safety documentation engine. Generate an authoritative, objective incident summary report for emergency services and trusted contacts based on this safety session:
Trip: ${JSON.stringify(trip)}
Risk Score: ${session.riskScore} / 100 (${session.riskState})
Signals: ${JSON.stringify(session.signals)}
Escalations: ${JSON.stringify(session.escalationHistory)}
Last Confirmed State: ${session.lastUserConfirmedState}

Output a clean, structured JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            incidentNumber: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  event: { type: Type.STRING },
                  severity: { type: Type.STRING },
                },
                required: ['time', 'event', 'severity'],
              },
            },
            riskFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            dispatchRecommendation: { type: Type.STRING },
          },
          required: ['incidentNumber', 'executiveSummary', 'timeline', 'riskFactors', 'dispatchRecommendation'],
        },
      },
    });

    const report = JSON.parse(response.text || '{}');
    return res.json({ success: true, report });
  } catch (err: any) {
    console.error('Incident report error:', err);
    return res.status(500).json({ error: err.message || 'Incident report generation failed' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startApp() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[GUARDIAN] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[GUARDIAN] WebSocket live endpoint at ws://0.0.0.0:${PORT}/api/live`);
  });
}

startApp().catch((err) => {
  console.error('[GUARDIAN] Startup failure:', err);
  process.exit(1);
});
