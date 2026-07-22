'use client';

import React from 'react';

interface QAReportData {
  testResults?: { testName: string; passed: boolean; errorLog?: string }[];
  fixSuggestions?: string[];
  logs?: string[];
}

interface QATask {
  taskId: string;
  taskType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  retries: number;
  qaReport?: QAReportData;
}

interface QADashboardViewProps {
  qaReports: QATask[];
  handleRestartPipeline: (taskId: string) => void;
  tokens: any;
}

export default function QADashboardView({
  qaReports,
  handleRestartPipeline,
  tokens
}: QADashboardViewProps) {
  return (
    <div className="bg-[#14171F] p-6 rounded-xl border border-white/10 space-y-4 shadow-xl select-text">
      <h3 className="text-xs font-mono font-bold text-[#C9A227] border-b border-white/10 pb-2.5 uppercase tracking-widest flex items-center justify-between">
        <span>Automated Test Runner</span>
        <span className="text-[10px] font-mono text-[#7E7A72]">Nemotron QA Specialist</span>
      </h3>

      <div className="space-y-3">
        {qaReports.map((task) => {
          const hasFailed = task.status === 'FAILED';
          const hasCompleted = task.status === 'COMPLETED';
          const hasRetried = task.retries > 0;

          return (
            <div key={task.taskId} className="p-4 rounded-lg border border-white/10 bg-[#0B0D12] flex flex-col gap-2 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] bg-[#14171F] text-[#C9A227] px-2 py-0.5 rounded border border-white/10 font-bold">
                    {task.taskId.split('_').pop() || task.taskId}
                  </span>
                  <span className="text-xs font-serif text-[#F2F0EC]">
                    {task.taskType === 'schema' ? 'Schema Validator' : task.taskType === 'backend' ? 'API Integrity' : 'Layout Engine'}
                  </span>
                </div>
                <span 
                  className={`px-2.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border ${
                    hasCompleted
                      ? 'bg-[#2D6A4F]/20 border-[#2D6A4F] text-[#52B788]'
                      : hasFailed
                      ? 'bg-[#9E2A2B]/20 border-[#9E2A2B] text-[#E63946]'
                      : 'bg-[#2B4C7E]/20 border-[#2B4C7E] text-[#9BB8E5]'
                  }`}
                >
                  {hasCompleted ? 'PASSED QA' : hasFailed ? 'FAILED QA' : 'RUNNING'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#7E7A72] font-mono">
                <span>Self-Healing Retries:</span>
                <span className={hasRetried ? 'text-[#C9A227] font-bold' : 'text-[#7E7A72]'}>
                  {task.retries} / 2 {hasRetried && '⚠️'}
                </span>
              </div>

              {/* Error Context & Options if Failed */}
              {hasFailed && (
                <div className="mt-2 p-3 rounded-lg bg-[#9E2A2B]/10 border border-[#9E2A2B]/30 text-[11px] text-[#E63946] space-y-2">
                  <div className="font-mono font-bold text-xs">Error Output:</div>
                  <pre className="font-mono text-[10px] whitespace-pre-wrap bg-[#0B0D12] p-2 rounded border border-[#9E2A2B]/20 leading-relaxed text-[#F2F0EC]">
                    {task.qaReport?.testResults?.find((t) => !t.passed)?.errorLog || 'Static type review failed.'}
                  </pre>
                  <div className="font-mono font-bold text-xs pt-1 text-[#C9A227]">Fix Suggestions:</div>
                  <ul className="list-disc list-inside space-y-1 pl-1 leading-relaxed text-[#C4C0B6]">
                    {task.qaReport?.fixSuggestions?.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Manual Failure Injection Control */}
              {!hasFailed && hasCompleted && (
                <button
                  type="button"
                  onClick={() => handleRestartPipeline(task.taskId)}
                  className="mt-1 self-end font-mono text-[9px] text-[#C9A227] hover:text-[#F2F0EC] underline bg-transparent"
                >
                  ⚡ Inject Mock Failure &amp; Test Self-Healer
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
