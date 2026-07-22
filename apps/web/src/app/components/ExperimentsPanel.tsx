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
    <div className="bg-[#14171F] p-6 rounded-xl border border-white/10 space-y-4 shadow-xl select-text">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-xs font-mono font-bold text-[#C9A227] uppercase tracking-widest">
          Post-Launch Experiments Engine
        </h3>
        <button
          type="button"
          onClick={handleTriggerGrowth}
          disabled={isGrowthRunning}
          className="px-3.5 py-1.5 bg-[#C9A227] hover:bg-[#A6841C] text-[#0B0D12] rounded-lg font-mono text-[9px] uppercase font-bold transition-all disabled:opacity-50 shadow-md"
        >
          {isGrowthRunning ? 'Running CRO Agent...' : '🔄 Run Growth Optimization Cycle'}
        </button>
      </div>

      {experiments.length === 0 ? (
        <p className="text-[#7E7A72] font-mono text-[11px] italic text-center py-6">
          No experiment variant records registered. Run a Growth Cycle to scan and propose tests!
        </p>
      ) : (
        <div className="space-y-4 text-xs font-sans">
          {experiments.map((exp) => {
            const isTesting = exp.status === 'TESTING';
            const isPending = exp.status === 'AWAITING_APPROVAL';
            const isPromoted = exp.status === 'PROMOTED';
            
            let statusBadge = { bg: 'bg-[#2B4C7E]/30 text-[#9BB8E5] border-[#2B4C7E]', text: exp.status };
            if (isTesting) statusBadge = { bg: 'bg-[#2B4C7E]/40 text-[#9BB8E5] border-[#2B4C7E]', text: 'TESTING (10% Traffic)' };
            if (isPending) statusBadge = { bg: 'bg-[#C9A227]/20 text-[#C9A227] border-[#C9A227]/40', text: 'AWAITING APPROVAL' };
            if (isPromoted) statusBadge = { bg: 'bg-[#2D6A4F]/20 text-[#52B788] border-[#2D6A4F]', text: 'PROMOTED (100% Traffic)' };

            const results = exp.result || { original: { impressions: 0, clicks: 0 }, variant: { impressions: 0, clicks: 0 } };
            const origCtr = results.original.impressions > 0 ? (results.original.clicks / results.original.impressions) * 100 : 0;
            const varCtr = results.variant.impressions > 0 ? (results.variant.clicks / results.variant.impressions) * 100 : 0;

            return (
              <div key={exp.id} className="p-4 rounded-lg border border-white/10 bg-[#0B0D12] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#F2F0EC] font-mono text-[10px] uppercase block">
                      🎯 {exp.elementTargeted}
                    </span>
                    <span className="text-[9px] text-[#7E7A72] font-mono uppercase">
                      RISK: {exp.riskTier} • Metric: {exp.metric}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${statusBadge.bg}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] bg-[#14171F] p-3 rounded-lg border border-white/5 font-mono">
                  <div className="space-y-1">
                    <div className="text-[#7E7A72] uppercase text-[9px]">Control (Original)</div>
                    <div className="font-medium text-[#C4C0B6] truncate" title={exp.variantContent.original}>"{exp.variantContent.original}"</div>
                    <div className="text-[#7E7A72] text-[10px]">
                      Views: {results.original.impressions} • Clicks: {results.original.clicks} ({origCtr.toFixed(1)}% CTR)
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-white/10 pl-3">
                    <div className="text-[#7E7A72] uppercase text-[9px]">Variant Copy</div>
                    <div className="font-bold text-[#C9A227] truncate" title={exp.variantContent.variant}>"{exp.variantContent.variant}"</div>
                    <div className="text-[#7E7A72] text-[10px]">
                      Views: {results.variant.impressions} • Clicks: {results.variant.clicks} ({varCtr.toFixed(1)}% CTR)
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
                        className="px-3 py-1 border border-white/10 rounded-lg bg-[#14171F] hover:bg-[#1E2330] text-[#C4C0B6] uppercase"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionExperiment(exp.id, 'approve')}
                        className="px-3.5 py-1 rounded-lg bg-[#C9A227] hover:bg-[#A6841C] text-[#0B0D12] font-bold uppercase"
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
                        className="px-3 py-1 border border-white/10 rounded-lg bg-[#14171F] hover:bg-[#1E2330] text-[#C4C0B6] uppercase"
                      >
                        Revert Control
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionExperiment(exp.id, 'promote')}
                        className="px-3.5 py-1 rounded-lg bg-[#52B788] hover:bg-[#2D6A4F] text-[#0B0D12] font-bold uppercase"
                      >
                        Promote (100% Traffic)
                      </button>
                    </>
                  )}

                  {exp.status === 'PROMOTED' && (
                    <span className="text-[#52B788] font-bold">✓ Variant promoted permanently to production.</span>
                  )}
                  {exp.status === 'REVERTED' && (
                    <span className="text-[#7E7A72] italic">Closed: variant rejected. Standard copy served.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Growth Logs Terminal */}
      {growthLogs.length > 0 && (
        <div className="mt-3 bg-[#0B0D12] text-[#7E7A72] p-3 rounded-lg font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-white/5">
          <div className="text-[#C9A227] uppercase border-b border-white/10 pb-1 mb-1 font-bold">Growth Optimization Logs</div>
          {growthLogs.map((log, idx) => (
            <div key={idx} className="truncate">» {log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
