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
    <div className="bg-white p-6 rounded border border-zinc-200 space-y-4 shadow-3xs">
      <h3 className="text-sm font-bold text-zinc-900 border-b pb-2 uppercase tracking-wide flex items-center justify-between">
        <span>Automated Test Runner</span>
        <span className="text-[10px] font-mono text-zinc-400">Nemotron QA Specialist</span>
      </h3>

      <div className="space-y-3">
        {qaReports.map((task) => {
          const hasFailed = task.status === 'FAILED';
          const hasCompleted = task.status === 'COMPLETED';
          const hasRetried = task.retries > 0;
          
          let statusLabel = 'Pending Review';
          let badgeStyle = { backgroundColor: '#F4F4F5', borderColor: '#E4E4E7', color: '#71717A' };

          if (hasCompleted) {
            statusLabel = 'PASSED QA';
            badgeStyle = { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#047857' };
          } else if (hasFailed) {
            statusLabel = 'FAILED QA';
            badgeStyle = { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', color: '#B91C1C' };
          } else if (task.status === 'RUNNING') {
            statusLabel = 'RUNNING';
            badgeStyle = { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' };
          }

          return (
            <div key={task.taskId} className="p-3.5 rounded border border-zinc-100 bg-zinc-50/50 flex flex-col gap-2 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] bg-zinc-200 text-zinc-700 px-1 rounded font-bold">
                    {task.taskId.split('_').pop() || task.taskId}
                  </span>
                  <span className="text-xs font-bold text-zinc-800">
                    {task.taskType === 'schema' ? 'Schema Validator' : task.taskType === 'backend' ? 'API Integrity' : 'Layout Engine'}
                  </span>
                </div>
                <span 
                  className="px-2 py-0.5 rounded border text-[8px] font-mono uppercase font-black"
                  style={badgeStyle}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>Healing Retries:</span>
                <span className={hasRetried ? 'text-amber-600 font-bold' : 'text-zinc-400'}>
                  {task.retries} / 2 {hasRetried && '⚠️'}
                </span>
              </div>

              {/* Error context and options if failed */}
              {hasFailed && (
                <div className="mt-2 p-2.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-700 space-y-1.5">
                  <div className="font-bold">Error Output:</div>
                  <pre className="font-mono text-[9px] whitespace-pre-wrap bg-white/50 p-1.5 rounded border border-red-100 leading-normal">
                    {task.qaReport?.testResults?.find((t) => !t.passed)?.errorLog || 'Static review failed.'}
                  </pre>
                  <div className="font-bold pt-1">Fix Suggestions:</div>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 leading-snug">
                    {task.qaReport?.fixSuggestions?.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Manual testing control */}
              {!hasFailed && hasCompleted && (
                <button
                  type="button"
                  onClick={() => handleRestartPipeline(task.taskId)}
                  className="mt-1 self-end font-mono text-[9px] text-red-600 hover:text-red-800 underline bg-transparent"
                >
                  ⚡ Inject Mock Failure &amp; Self-Heal
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
