'use client';

import React from 'react';

interface FileItem {
  path: string;
  content: string;
}

interface TaskNode {
  id: string;
  taskType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  payload?: {
    title?: string;
  };
  result?: {
    files?: FileItem[];
    logs?: string[];
  };
}

interface CodingCanvasViewProps {
  executionTasks: TaskNode[];
  selectedFile: FileItem | null;
  setSelectedFile: (file: FileItem | null) => void;
  tokens: any;
}

export default function CodingCanvasView({
  executionTasks,
  selectedFile,
  setSelectedFile,
  tokens
}: CodingCanvasViewProps) {
  // Aggregate all files created across tasks
  const filesList: FileItem[] = [];
  executionTasks.forEach((task) => {
    if (task.result?.files) {
      task.result.files.forEach((f) => {
        if (!filesList.some((existing) => existing.path === f.path)) {
          filesList.push(f);
        }
      });
    }
  });

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full max-w-5xl mx-auto pb-10 select-text">
      {/* Running Pipeline Status Header */}
      <div className="p-4 bg-[#14171F] text-[#F2F0EC] rounded-xl border border-[#C9A227]/30 flex items-center justify-between gap-4 shadow-xl font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C9A227] animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-[#C9A227]">CoderAgent Engine Active</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-[#7E7A72]">
          <div>PIPELINE: Sequential Execution</div>
          <div>STATUS: Synthesizing Components</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Task pipeline and Explorer */}
        <div className="col-span-12 md:col-span-4 space-y-6 flex flex-col">
          {/* Active Task Queue */}
          <div className="bg-[#14171F] p-5 rounded-xl border border-white/10 space-y-4 shadow-xl flex-1">
            <h3 className="text-xs font-mono font-bold text-[#C9A227] border-b border-white/10 pb-2.5 uppercase tracking-widest">
              Task Execution Status
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {executionTasks.map((task) => {
                const isRunning = task.status === 'RUNNING';
                const isCompleted = task.status === 'COMPLETED';
                const isFailed = task.status === 'FAILED';

                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                      isRunning 
                        ? 'border-[#2B4C7E] bg-[#2B4C7E]/20 text-[#9BB8E5]' 
                        : isCompleted 
                        ? 'border-[#2D6A4F]/50 bg-[#2D6A4F]/10 text-[#52B788]' 
                        : isFailed 
                        ? 'border-[#9E2A2B]/50 bg-[#9E2A2B]/10 text-[#E63946]' 
                        : 'border-white/10 bg-[#0B0D12] text-[#C4C0B6]'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-mono text-[9px] text-[#7E7A72] uppercase">{task.id}</div>
                      <div className="font-serif text-xs truncate">
                        {task.payload?.title || 'Synthesis Task'}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold border ${
                        isRunning
                          ? 'bg-[#2B4C7E]/40 border-[#2B4C7E] text-[#9BB8E5] animate-pulse'
                          : isCompleted
                          ? 'bg-[#2D6A4F]/30 border-[#2D6A4F] text-[#52B788]'
                          : isFailed
                          ? 'bg-[#9E2A2B]/30 border-[#9E2A2B] text-[#E63946]'
                          : 'bg-[#0B0D12] border-white/10 text-[#7E7A72]'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workspace File Explorer */}
          <div className="bg-[#14171F] p-5 rounded-xl border border-white/10 space-y-3 shadow-xl">
            <h3 className="text-xs font-mono font-bold text-[#C9A227] border-b border-white/10 pb-2.5 uppercase tracking-widest">
              Explorer Workspace
            </h3>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 font-mono text-[11px]">
              {filesList.length === 0 ? (
                <div className="text-[#7E7A72] py-2 italic text-center">No files synthesized yet.</div>
              ) : (
                filesList.map((file) => {
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <button
                      type="button"
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 transition-all ${
                        isSelected 
                          ? 'bg-[#C9A227]/15 text-[#F2F0EC] font-bold border border-[#C9A227]/40' 
                          : 'border border-transparent hover:bg-[#0B0D12] text-[#C4C0B6]'
                      }`}
                    >
                      <span className="text-xs text-[#C9A227]">📄</span>
                      <span className="truncate" title={file.path}>
                        {file.path.split('/').pop()}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Code Editor Canvas */}
        <div className="col-span-12 md:col-span-8 bg-[#0B0D12] rounded-xl border border-white/10 flex flex-col shadow-2xl overflow-hidden min-h-[500px]">
          {/* Editor Header */}
          <div className="px-4 py-3 bg-[#14171F] border-b border-white/10 flex items-center justify-between font-mono text-[10px] text-[#7E7A72]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9E2A2B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
              <span className="ml-2 truncate text-[#F2F0EC] font-bold" title={selectedFile?.path || 'Untitled'}>
                {selectedFile?.path || 'workspace_empty.ts'}
              </span>
            </div>
            <span className="text-[#C9A227]">TypeScript // React 19</span>
          </div>

          {/* Editor Canvas */}
          <div className="flex-1 p-5 font-mono text-xs overflow-auto text-[#F2F0EC] leading-relaxed">
            {selectedFile ? (
              <pre className="whitespace-pre">
                <code>{selectedFile.content}</code>
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#7E7A72] italic space-y-2 py-20">
                <span>⚡ CoderAgent is generating codebase files...</span>
                <span className="text-[10px] uppercase font-mono tracking-widest bg-[#14171F] border border-white/10 px-3 py-1 rounded-lg not-italic text-[#C4C0B6]">
                  Awaiting first file commit
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
