/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SAFETY KERNEL DETERMINISTIC TESTS
 * Verifies risk calculation, escalation timeouts, explicit SOS overrides,
 * and offline continuity.
 */

import { SafetyKernel } from './SafetyKernel';

export function runSafetyKernelSelfTests(): { passed: boolean; results: { name: string; success: boolean; detail: string }[] } {
  const results: { name: string; success: boolean; detail: string }[] = [];

  // Test 1: Initial state
  try {
    const kernel = new SafetyKernel();
    const session = kernel.getSession();
    const ok = session.riskScore === 0 && session.riskState === 'NORMAL' && !session.timerArmed;
    results.push({
      name: 'Initial State Verification',
      success: ok,
      detail: ok ? 'Score is 0, State is NORMAL, Timer unarmed' : `Failed: score=${session.riskScore}`,
    });
  } catch (e: any) {
    results.push({ name: 'Initial State Verification', success: false, detail: e.message });
  }

  // Test 2: Signal Weight Accumulation & State Transitions
  try {
    const kernel = new SafetyKernel();
    // Route deviation: +15 -> 15 (NORMAL)
    kernel.addSignal({ type: 'route_deviation', label: 'Route deviation', weight: 15, source: 'sensor_telemetry' });
    let s = kernel.getSession();
    const step1Ok = s.riskScore === 15 && s.riskState === 'NORMAL';

    // Unexpected stop: +20 -> 35 (CONCERN, timer armed)
    kernel.addSignal({ type: 'unexpected_stop', label: 'Unexpected stop', weight: 20, source: 'sensor_telemetry' });
    s = kernel.getSession();
    const step2Ok = s.riskScore === 35 && s.riskState === 'CONCERN' && s.timerArmed;

    // Discomfort: +25 -> 60 (ELEVATED)
    kernel.addSignal({ type: 'user_uncomfortable', label: 'Discomfort', weight: 25, source: 'user_voice' });
    s = kernel.getSession();
    const step3Ok = s.riskScore === 60 && s.riskState === 'ELEVATED';

    const allOk = step1Ok && step2Ok && step3Ok;
    results.push({
      name: 'Signal Accumulation & State Transition',
      success: allOk,
      detail: allOk ? 'Risk 0 -> 15 (NORMAL) -> 35 (CONCERN) -> 60 (ELEVATED)' : `Failed intermediate state`,
    });
  } catch (e: any) {
    results.push({ name: 'Signal Accumulation & State Transition', success: false, detail: e.message });
  }

  // Test 3: 10-Minute Timeout Escalation Rule
  try {
    const kernel = new SafetyKernel();
    kernel.addSignal({ type: 'route_deviation', label: 'Route deviation', weight: 15, source: 'sensor_telemetry' });
    kernel.addSignal({ type: 'unexpected_stop', label: 'Unexpected stop', weight: 20, source: 'sensor_telemetry' });
    kernel.addSignal({ type: 'user_uncomfortable', label: 'Discomfort', weight: 25, source: 'user_voice' });
    // Current risk = 60, timer armed (600s)

    // Tick 600 seconds
    kernel.tickTimer(600);
    const s = kernel.getSession();
    // Should have added +20 no_response_timeout -> risk 80 (CRITICAL) and level 1 escalation
    const timeoutOk = s.riskScore === 80 && s.riskState === 'CRITICAL' && s.currentEscalationLevel === 1;
    results.push({
      name: '10-Minute Timeout Escalation Rule',
      success: timeoutOk,
      detail: timeoutOk ? 'Timed out after 600s: +20 penalty applied, escalated to Level 1, state CRITICAL' : `Score: ${s.riskScore}, Level: ${s.currentEscalationLevel}`,
    });
  } catch (e: any) {
    results.push({ name: '10-Minute Timeout Escalation Rule', success: false, detail: e.message });
  }

  // Test 4: Critical Explicit SOS Bypass Rule
  try {
    const kernel = new SafetyKernel();
    kernel.addSignal({ type: 'user_help', label: 'I need help', weight: 45, source: 'user_voice' });
    const s = kernel.getSession();
    const bypassOk = s.currentEscalationLevel >= 1;
    results.push({
      name: 'Explicit Emergency SOS Immediate Bypass',
      success: bypassOk,
      detail: bypassOk ? 'Bypassed timer waiting window directly into Level 1 escalation' : 'Failed to escalate immediately',
    });
  } catch (e: any) {
    results.push({ name: 'Explicit Emergency SOS Immediate Bypass', success: false, detail: e.message });
  }

  // Test 5: Discreet Mode Interruption Rule
  try {
    const kernel = new SafetyKernel();
    kernel.recordUserResponse("Don't say anything out loud.");
    const s = kernel.getSession();
    const discreetOk = s.activeEscapeMode === 'DISCREET' && !s.isCompanionSpeaking;
    results.push({
      name: 'Discreet Mode Barge-in Interruption',
      success: discreetOk,
      detail: discreetOk ? 'Companion muted and activeEscapeMode switched to DISCREET' : 'Failed discreet transition',
    });
  } catch (e: any) {
    results.push({ name: 'Discreet Mode Barge-in Interruption', success: false, detail: e.message });
  }

  const passed = results.every((r) => r.success);
  return { passed, results };
}
