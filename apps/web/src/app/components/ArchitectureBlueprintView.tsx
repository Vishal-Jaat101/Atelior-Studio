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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex flex-col space-y-6 max-w-4xl mx-auto w-full pb-10 select-text"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#C9A227] bg-[#C9A227]/10 border border-[#C9A227]/30 px-2.5 py-1 rounded">
            Architect Agent // Technical Specification
          </span>
          <h2 className="text-3xl font-serif text-[#F2F0EC] mt-1">
            System Architecture &amp; Task Graph
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBlueprint(null)}
            className="px-3.5 py-1.5 border border-white/10 rounded-lg font-mono text-[10px] uppercase text-[#C4C0B6] hover:bg-[#1E2330] hover:text-[#F2F0EC] transition-all"
          >
            Back to Brief
          </button>
          <span className="px-2.5 py-1 bg-[#2D6A4F]/20 border border-[#2D6A4F] text-[#52B788] rounded-lg font-mono text-[9px] uppercase font-bold">
            Locked Blueprint
          </span>
        </div>
      </div>

      {/* Conflict Banner */}
      {activeNegotiation ? (
        <div className="p-5 rounded-xl border border-[#C9A227]/40 bg-[#14171F] text-[#F2F0EC] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#C9A227] uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-ping" />
              Conflict Resolution Required: Scope vs. Timeline
            </span>
            <span className="px-2 py-0.5 rounded bg-[#2B4C7E]/40 border border-[#2B4C7E] text-[#9BB8E5] text-[9px] font-mono">
              {activeNegotiation.agentsInvolved.join(' ⇄ ')}
            </span>
          </div>
          <p className="text-xs text-[#C4C0B6] leading-relaxed">
            {activeNegotiation.conflictSummary}
          </p>
          <div className="space-y-2">
            <div className="text-[9px] font-mono text-[#7E7A72] uppercase">Select resolution strategy:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleResolveNegotiation('Prioritize Timeline')}
                className="p-3.5 text-left rounded-lg border border-white/10 bg-[#0B0D12] hover:border-[#C9A227]/40 text-xs text-[#F2F0EC] transition-all"
              >
                ⚡ Prioritize Timeline: Omit custom 3D orbit viewer assets to hit 3-day MVP target.
              </button>
              <button
                type="button"
                onClick={() => handleResolveNegotiation('Prioritize Scope')}
                className="p-3.5 text-left rounded-lg border border-white/10 bg-[#0B0D12] hover:border-[#C9A227]/40 text-xs text-[#F2F0EC] transition-all"
              >
                🎨 Prioritize Scope: Extend timeline to 10 days to support advanced WebGL 3D viewports.
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleTriggerMockConflict}
            className="px-3.5 py-1.5 rounded-lg border border-dashed border-[#C9A227]/30 bg-[#C9A227]/10 hover:bg-[#C9A227]/20 text-[#C9A227] text-[10px] font-mono transition-all font-semibold"
          >
            ⚡ Trigger Mock Scope-vs-Time Agent Conflict
          </button>
        </div>
      )}

      {/* Tabs Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* System Architecture Section */}
        <div className="col-span-12 md:col-span-7 space-y-6">
          <div className="bg-[#14171F] p-6 rounded-xl border border-white/10 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-[#C9A227] border-b border-white/10 pb-2.5 uppercase tracking-widest">
              Implementation Pages
            </h3>
            <div className="space-y-3">
              {blueprint.pages?.map((p, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border border-white/10 bg-[#0B0D12] flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#C9A227] bg-[#C9A227]/10 px-2 py-0.5 rounded border border-[#C9A227]/20">
                        {p.route}
                      </span>
                      <span className="font-serif text-sm text-[#F2F0EC]">{p.componentName}</span>
                    </div>
                    <p className="text-[11px] text-[#C4C0B6] leading-relaxed">{p.description}</p>
                  </div>
                  {p.has3D && (
                    <span className="px-2 py-0.5 rounded bg-[#2B4C7E]/40 border border-[#2B4C7E] text-[#9BB8E5] text-[9px] font-mono uppercase font-bold">
                      3D Canvas
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#14171F] p-6 rounded-xl border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-xs font-mono font-bold text-[#C9A227] uppercase tracking-widest">
                Prisma Data Models
              </h3>
              <span className="px-2 py-0.5 rounded bg-[#0B0D12] text-[#7E7A72] font-mono text-[9px] border border-white/5">
                schema.prisma
              </span>
            </div>
            <pre className="p-4 rounded-lg bg-[#0B0D12] text-[#F2F0EC] text-xs font-mono overflow-x-auto border border-white/5 leading-relaxed max-h-56">
              <code>{blueprint.dataModelSketch}</code>
            </pre>
          </div>

          <div className="bg-[#14171F] p-6 rounded-xl border border-white/10 space-y-3 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-[#C9A227] border-b border-white/10 pb-2.5 uppercase tracking-widest">
              Target Integrations
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {blueprint.integrations?.map((int, idx) => (
                <span key={idx} className="px-3 py-1 rounded-lg bg-[#0B0D12] border border-white/10 text-[#C4C0B6] font-mono text-xs">
                  🔌 {int}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Task Graph Section */}
        <div className="col-span-12 md:col-span-5 space-y-6">
          <div className="bg-[#14171F] p-6 rounded-xl border border-white/10 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-[#C9A227] border-b border-white/10 pb-2.5 uppercase tracking-widest">
              Sequential Task Graph
            </h3>
            <div className="space-y-4 relative pl-3 border-l border-white/10">
              {blueprint.tasks?.map((task) => (
                <div key={task.id} className="relative space-y-1.5 pb-2">
                  <span className="absolute -left-[16.5px] top-1.5 w-2.5 h-2.5 rounded-full border border-[#C9A227] bg-[#0B0D12]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#C9A227] bg-[#0B0D12] px-1.5 py-0.5 rounded border border-white/10">
                      {task.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#2B4C7E]/40 border border-[#2B4C7E] text-[#9BB8E5] text-[8px] font-mono uppercase font-bold">
                      {task.taskType}
                    </span>
                  </div>
                  <h4 className="text-xs font-serif text-[#F2F0EC]">
                    {task.payload?.title || 'Coding Task'}
                  </h4>
                  <p className="text-[10.5px] text-[#C4C0B6] leading-relaxed">
                    {task.payload?.instructions || 'Generate components and verify integration.'}
                  </p>
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="text-[9px] font-mono text-[#7E7A72]">
                      Requires: {task.dependencies.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Synthetic Walkthrough Panel */}
          <div className="bg-[#14171F] p-6 rounded-xl border border-white/10 space-y-4 shadow-xl">
            <div>
              <h3 className="text-xs font-mono font-bold text-[#C9A227] uppercase tracking-widest">
                Synthetic User Testing
              </h3>
              <p className="text-[#7E7A72] text-[11px] leading-relaxed pt-1 font-mono">
                Deploy simulated customer persona to validate design tokens and flow.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-[#7E7A72] uppercase">Test URL Sandbox</label>
                <input
                  type="text"
                  value={previewUrlInput}
                  onChange={(e) => setPreviewUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono bg-[#0B0D12] text-[#F2F0EC] outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleRunUsabilityTest}
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-[#0B0D12] bg-[#C9A227] hover:bg-[#A6841C] transition-all"
              >
                {loading ? 'Running Walkthrough...' : 'Run Synthetic Walkthrough'}
              </button>
            </div>

            {usabilityReport && (
              <div className="p-4 rounded-lg border border-white/10 bg-[#0B0D12] text-left space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <div className="font-serif text-sm text-[#F2F0EC]">{usabilityReport.personaName}</div>
                    <div className="text-[9px] font-mono text-[#7E7A72]">Persona Profile</div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <span key={idx} className="text-[#C9A227] text-sm">
                        {idx < usabilityReport.overallRating ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[#C4C0B6] italic leading-relaxed">
                  "{usabilityReport.personaBio}"
                </p>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#7E7A72] uppercase font-bold">Steps Taken</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-[#C4C0B6] pl-1 font-mono">
                    {usabilityReport.walkthroughSteps?.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-[#14171F] border border-white/5 text-[11px] text-[#C4C0B6] leading-relaxed">
                  <strong className="text-[#C9A227]">Recommendation:</strong> {usabilityReport.critiqueSummary}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary CTA Action */}
      <div className="pt-6 flex justify-end gap-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleApproveAndBeginCoding}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-[#C9A227] hover:bg-[#A6841C] text-[#0B0D12] font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#C9A227]/20 transition-all disabled:opacity-50"
        >
          {loading ? 'Initializing Pipeline...' : '✓ Approve Architecture & Begin Coding'}
        </button>
      </div>
    </motion.div>
  );
}
