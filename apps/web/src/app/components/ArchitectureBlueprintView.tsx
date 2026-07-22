'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageItem {
  route: string;
  componentName: string;
  description: string;
  has3D: boolean;
}

interface TaskItem {
  id: string;
  taskType: string;
  payload?: {
    title?: string;
    instructions?: string;
  };
  dependencies?: string[];
}

interface ArchitectureBlueprintViewProps {
  blueprint: {
    pages?: PageItem[];
    dataModelSketch?: string;
    integrations?: string[];
    tasks?: TaskItem[];
  };
  setBlueprint: (val: any | null) => void;
  activeNegotiation: any | null;
  handleResolveNegotiation: (choice: string) => void;
  handleTriggerMockConflict: () => void;
  previewUrlInput: string;
  setPreviewUrlInput: (val: string) => void;
  handleRunUsabilityTest: () => void;
  usabilityReport: any | null;
  handleApproveAndBeginCoding: () => void;
  loading: boolean;
  tokens: any;
}

export default function ArchitectureBlueprintView({
  blueprint,
  setBlueprint,
  activeNegotiation,
  handleResolveNegotiation,
  handleTriggerMockConflict,
  previewUrlInput,
  setPreviewUrlInput,
  handleRunUsabilityTest,
  usabilityReport,
  handleApproveAndBeginCoding,
  loading,
  tokens
}: ArchitectureBlueprintViewProps) {
  return (
    <motion.div
      key="blueprint-stage"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col space-y-6 max-w-4xl mx-auto w-full pb-10 select-text"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4 border-zinc-200">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#28456B] bg-[#28456B]/10 px-2 py-0.5 rounded">
            Technical Blueprint
          </span>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
            Architecture &amp; Tasks
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBlueprint(null)}
            className="px-3 py-1.5 border rounded font-mono text-[9px] uppercase hover:bg-zinc-50 border-zinc-300 text-zinc-600 font-bold"
          >
            Back to Brief
          </button>
          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[9px] uppercase font-bold">
            Locked Blueprint
          </span>
        </div>
      </div>

      {/* Conflict Banner */}
      {activeNegotiation ? (
        <div className="p-5 rounded border border-amber-300 bg-amber-50/75 text-zinc-900 space-y-4 shadow-sm animate-pulse">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
              ⚠️ Conflict Detected: Scope vs. Timeline Tradeoff
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 text-[8px] font-mono">
              {activeNegotiation.agentsInvolved.join(' ⇄ ')}
            </span>
          </div>
          <p className="text-xs text-zinc-700 leading-relaxed font-medium">
            {activeNegotiation.conflictSummary}
          </p>
          <div className="space-y-2">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">Select resolution choice:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleResolveNegotiation('Prioritize Timeline')}
                className="p-3 text-left rounded border border-amber-200 bg-white hover:bg-amber-100/50 text-xs font-semibold text-zinc-800 transition-all shadow-3xs"
              >
                ⚡ Prioritize Timeline: Drop custom 3D orbit viewer assets to hit fast 3-day MVP target.
              </button>
              <button
                type="button"
                onClick={() => handleResolveNegotiation('Prioritize Scope')}
                className="p-3 text-left rounded border border-amber-200 bg-white hover:bg-amber-100/50 text-xs font-semibold text-zinc-800 transition-all shadow-3xs"
              >
                🎨 Prioritize Scope: Extend timeline to 10 days to support advanced three.js visual assets.
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleTriggerMockConflict}
            className="px-3 py-1.5 rounded border border-dashed border-amber-400 bg-amber-50/20 hover:bg-amber-50 text-amber-700 text-[10px] font-mono transition-all font-bold"
          >
            ⚡ Trigger Mock Scope-vs-Time Conflict
          </button>
        </div>
      )}

      {/* Tabs Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* System Architecture Section */}
        <div className="col-span-12 md:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded border border-zinc-200 space-y-4 shadow-3xs">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-2 uppercase tracking-wide">
              Implementation Pages
            </h3>
            <div className="space-y-3">
              {blueprint.pages?.map((p, idx) => (
                <div key={idx} className="p-3 rounded border border-zinc-100 bg-zinc-50/50 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-700 bg-zinc-200/60 px-1.5 py-0.5 rounded">
                        {p.route}
                      </span>
                      <span className="font-bold text-xs text-zinc-900">{p.componentName}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-normal">{p.description}</p>
                  </div>
                  {p.has3D && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-mono uppercase font-bold">
                      3D Canvas
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded border border-zinc-200 space-y-4 shadow-3xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Prisma Data Models
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[9px]">schema.prisma</span>
            </div>
            <pre className="p-4 rounded bg-zinc-900 text-zinc-100 text-xs font-mono overflow-x-auto shadow-inner leading-relaxed max-h-56">
              <code>{blueprint.dataModelSketch}</code>
            </pre>
          </div>

          <div className="bg-white p-6 rounded border border-zinc-200 space-y-3 shadow-3xs">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-2 uppercase tracking-wide">
              Target Integrations
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {blueprint.integrations?.map((int, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-medium text-xs">
                  🔌 {int}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Task Graph Section */}
        <div className="col-span-12 md:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded border border-zinc-200 space-y-4 shadow-3xs">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-2 uppercase tracking-wide">
              Sequential Task Graph
            </h3>
            <div className="space-y-4 relative pl-3 border-l border-zinc-200">
              {blueprint.tasks?.map((task) => (
                <div key={task.id} className="relative space-y-1.5 pb-2">
                  {/* Connector dot */}
                  <span className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border border-zinc-300 bg-white" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded font-mono">
                      {task.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[8px] font-mono uppercase font-bold">
                      {task.taskType}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-800">
                    {task.payload?.title || 'Coding Task'}
                  </h4>
                  <p className="text-[10.5px] text-zinc-500 leading-normal">
                    {task.payload?.instructions || 'Generate components and verify integration.'}
                  </p>
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="text-[9px] font-mono text-zinc-400">
                      Requires: {task.dependencies.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Synthetic Walkthrough Panel */}
          <div className="bg-zinc-50 p-6 rounded border border-zinc-200 space-y-4 shadow-3xs">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
                Synthetic User Testing
              </h3>
              <p className="text-zinc-500 text-[10.5px] leading-relaxed pt-1">
                Deploy a simulated customer persona to validate the current design tokens and layout flow against user needs.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-zinc-400 uppercase">Test URL Sandbox</label>
                <input
                  type="text"
                  value={previewUrlInput}
                  onChange={(e) => setPreviewUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-zinc-300 text-xs font-mono bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleRunUsabilityTest}
                disabled={loading}
                className="w-full py-2 rounded text-xs font-bold uppercase transition-all tracking-wider text-white hover:brightness-95"
                style={{ backgroundColor: tokens.colors.blueprint600 }}
              >
                {loading ? 'Running Walkthrough...' : 'Run Walkthrough'}
              </button>
            </div>

            {usabilityReport && (
              <div className="p-4 rounded border border-zinc-200 bg-white text-left space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between border-b pb-2 border-zinc-200">
                  <div>
                    <div className="font-bold text-zinc-800">{usabilityReport.personaName}</div>
                    <div className="text-[9px] text-zinc-400">Persona Profile</div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx} className="text-amber-400 text-sm">
                        {idx < usabilityReport.overallRating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 italic leading-relaxed">
                  "{usabilityReport.personaBio}"
                </p>
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Steps Taken</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-600 pl-1">
                    {usabilityReport.walkthroughSteps?.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Friction Points</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-red-600 pl-1">
                    {usabilityReport.frictionPoints?.map((f: string, idx: number) => (
                      <li key={idx} className="leading-snug">{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2.5 rounded bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-700 leading-normal">
                  <strong>Recommendation:</strong> {usabilityReport.critiqueSummary}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary CTA Action */}
      <div className="pt-6 flex justify-end gap-4 border-t border-zinc-200">
        <button
          type="button"
          onClick={handleApproveAndBeginCoding}
          disabled={loading}
          className="px-6 py-3 rounded text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          style={{ backgroundColor: tokens.colors.blueprint600 }}
        >
          {loading ? 'Initializing Pipeline...' : '✓ Approve Architecture & Begin Coding'}
        </button>
      </div>
    </motion.div>
  );
}
