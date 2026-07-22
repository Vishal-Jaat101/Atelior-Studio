'use client';

import React from 'react';

interface ExperimentVariant {
  id: string;
  elementTargeted: string;
  status: string;
  variantContent: {
    original: string;
    variant: string;
  };
  riskTier: string;
  metric: string;
  trafficPercent: number;
  result?: {
    original: { impressions: number; clicks: number };
    variant: { impressions: number; clicks: number };
  };
}

interface ExperimentsPanelProps {
  experiments: ExperimentVariant[];
  handleTriggerGrowth: () => void;
  isGrowthRunning: boolean;
  handleActionExperiment: (id: string, action: 'approve' | 'reject' | 'promote' | 'revert') => void;
  growthLogs: string[];
}

export default function ExperimentsPanel({
  experiments,
  handleTriggerGrowth,
  isGrowthRunning,
  handleActionExperiment,
  growthLogs
}: ExperimentsPanelProps) {
  return (
    <div className="bg-white p-6 rounded border border-zinc-200 space-y-4 shadow-3xs">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">
          Post-Launch Experiments Panel
        </h3>
        <button
          type="button"
          onClick={handleTriggerGrowth}
          disabled={isGrowthRunning}
          className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded font-mono text-[9px] uppercase font-bold transition-all disabled:opacity-50"
        >
          {isGrowthRunning ? 'Running CRO Agent...' : '🔄 Run Growth Optimization Cycle'}
        </button>
      </div>

      {experiments.length === 0 ? (
        <p className="text-zinc-400 font-mono text-[10.5px] italic text-center py-4">
          No experiment variant records registered. Run a Growth Cycle to scan and propose tests!
        </p>
      ) : (
        <div className="space-y-4 text-xs font-sans">
          {experiments.map((exp) => {
            const isTesting = exp.status === 'TESTING';
            const isPending = exp.status === 'AWAITING_APPROVAL';
            const isPromoted = exp.status === 'PROMOTED';
            
            let statusBadge = { bg: 'bg-zinc-100 text-zinc-600', text: exp.status };
            if (isTesting) statusBadge = { bg: 'bg-blue-100 text-blue-800', text: 'TESTING (10% Traffic)' };
            if (isPending) statusBadge = { bg: 'bg-amber-100 text-amber-800', text: 'AWAITING APPROVAL' };
            if (isPromoted) statusBadge = { bg: 'bg-emerald-100 text-emerald-800', text: 'PROMOTED (100% Traffic)' };

            const results = exp.result || { original: { impressions: 0, clicks: 0 }, variant: { impressions: 0, clicks: 0 } };
            const origCtr = results.original.impressions > 0 ? (results.original.clicks / results.original.impressions) * 100 : 0;
            const varCtr = results.variant.impressions > 0 ? (results.variant.clicks / results.variant.impressions) * 100 : 0;

            return (
              <div key={exp.id} className="p-4 rounded border border-zinc-100 bg-zinc-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-900 font-mono text-[10px] uppercase block">
                      🎯 {exp.elementTargeted}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono uppercase">
                      RISK: {exp.riskTier} · Metric: {exp.metric}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${statusBadge.bg}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] bg-white p-2.5 rounded border border-zinc-200 font-mono">
                  <div className="space-y-1">
                    <div className="text-zinc-400 uppercase text-[9px]">Control (Original)</div>
                    <div className="font-medium text-zinc-800 truncate" title={exp.variantContent.original}>"{exp.variantContent.original}"</div>
                    <div className="text-zinc-500 text-[10px]">
                      Views: {results.original.impressions} · Clicks: {results.original.clicks} ({origCtr.toFixed(1)}% CTR)
                    </div>
                  </div>
                  <div className="space-y-1 border-l pl-3">
                    <div className="text-zinc-400 uppercase text-[9px]">Variant Copy</div>
                    <div className="font-bold text-teal-700 truncate" title={exp.variantContent.variant}>"{exp.variantContent.variant}"</div>
                    <div className="text-zinc-500 text-[10px]">
                      Views: {results.variant.impressions} · Clicks: {results.variant.clicks} ({varCtr.toFixed(1)}% CTR)
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex justify-end gap-2 text-[10px] font-mono">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleActionExperiment(exp.id, 'reject')}
                        className="px-2.5 py-1 border border-zinc-300 rounded bg-white hover:bg-zinc-50 text-zinc-600 uppercase"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionExperiment(exp.id, 'approve')}
                        className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white uppercase"
                      >
                        ✓ Approve &amp; Launch
                      </button>
                    </>
                  )}

                  {isTesting && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleActionExperiment(exp.id, 'revert')}
                        className="px-2.5 py-1 border border-zinc-300 rounded bg-white hover:bg-zinc-50 text-zinc-600 uppercase"
                      >
                        Revert Control
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionExperiment(exp.id, 'promote')}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white uppercase"
                      >
                        Promote (100% Traffic)
                      </button>
                    </>
                  )}

                  {exp.status === 'PROMOTED' && (
                    <span className="text-emerald-600 font-bold">✓ Variant promoted permanently to production.</span>
                  )}
                  {exp.status === 'REVERTED' && (
                    <span className="text-zinc-500 italic">Closed: variant rejected. Standard copy served.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Growth logs terminal */}
      {growthLogs.length > 0 && (
        <div className="mt-3 bg-zinc-900 text-zinc-300 p-3 rounded font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto">
          <div className="text-zinc-500 uppercase border-b border-zinc-800 pb-1 mb-1 font-bold">Growth Optimization Logs</div>
          {growthLogs.map((log, idx) => (
            <div key={idx} className="truncate">» {log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
