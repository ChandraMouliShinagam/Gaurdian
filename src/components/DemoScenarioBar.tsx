/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, ChevronRight, ChevronDown, Sparkles, RefreshCw, Compass, Shield, Mic, WifiOff, Wifi } from 'lucide-react';

export interface DemoScene {
  id: number;
  label: string;
  tagline: string;
  description: string;
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: 1,
    label: 'Scene 1: Start Ride',
    tagline: 'Risk 0 · Normal',
    description: 'Priya boards cab in Banjara Hills. Home → Destination. Session active.',
  },
  {
    id: 2,
    label: 'Scene 2: Natural Speech',
    tagline: 'Gemini 3.8 Live',
    description: 'Priya speaks conversationally; Gemini Live speaks back reassuringly.',
  },
  {
    id: 3,
    label: 'Scene 3: Cross-Language',
    tagline: 'Driver Hindi · Passenger Telugu/Eng',
    description: 'Multi-speaker acoustic context and language bridge active.',
  },
  {
    id: 4,
    label: 'Scene 4: Route Deviation',
    tagline: '+15 Risk · Auto Check-in',
    description: 'Detour injected. Gemini Live: "I noticed the route has changed. Are you okay?"',
  },
  {
    id: 5,
    label: 'Scene 5: Unexpected Stop',
    tagline: '+20 Risk · 35 Concern',
    description: 'Vehicle stops in dark canal sector. Check-in countdown timer arms.',
  },
  {
    id: 6,
    label: 'Scene 6: Discomfort Voiced',
    tagline: '+25 Risk · 60 Elevated',
    description: 'Passenger whispers: "I\'m uncomfortable." Guardian prepares discreet mode.',
  },
  {
    id: 7,
    label: 'Scene 7: Barge-in Interrupt',
    tagline: 'Discreet Mode · Timer Armed',
    description: 'Passenger: "Don\'t say anything out loud." Live voice cuts immediately. UI locks covert.',
  },
  {
    id: 8,
    label: 'Scene 8: 10-Min Timeout',
    tagline: 'Level 1 Escalation · Mom Alert',
    description: '10 simulated minutes pass with no response. Risk 80 Critical. Alert dispatched.',
  },
  {
    id: 9,
    label: 'Scene 9: Network Lost',
    tagline: 'Gemma 4 E2B Local Mode',
    description: 'Cellular network drops. Passenger: "I need help." Offline kernel executes locally.',
  },
  {
    id: 10,
    label: 'Scene 10: Cloud Restored',
    tagline: 'Session Sync & Report',
    description: 'Network reconnects. Safety session syncs. Gemini 3.8 Flash compiles incident report.',
  },
];

interface DemoScenarioBarProps {
  currentScene: number;
  onSelectScene: (sceneId: number) => void;
  onResetDemo: () => void;
}

export const DemoScenarioBar: React.FC<DemoScenarioBarProps> = ({
  currentScene,
  onSelectScene,
  onResetDemo,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-slate-950/95 border-t border-slate-800 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Toggle Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Hackathon Demo Scenario Orchestrator (10 Scenes)
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              — Step through the exact solo cab traveler safety story
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              title="Reset trip and safety kernel to Scene 1 baseline"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Demo
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Scene Buttons List */}
        {isExpanded && (
          <div className="mt-2.5 pt-2 border-t border-slate-900/90 grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 overflow-x-auto pb-1">
            {DEMO_SCENES.map((scene) => {
              const isActive = currentScene === scene.id;
              return (
                <button
                  key={scene.id}
                  onClick={() => onSelectScene(scene.id)}
                  title={scene.description}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-1 ring-indigo-400/50 scale-[1.02]'
                      : 'bg-slate-900/80 hover:bg-slate-850 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-indigo-100' : 'text-indigo-400'}`}>
                      #{scene.id}
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </div>
                  <div className="font-semibold text-[11px] truncate leading-tight mt-0.5">
                    {scene.label.replace(`Scene ${scene.id}: `, '')}
                  </div>
                  <div className={`text-[9px] truncate font-mono mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {scene.tagline}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
