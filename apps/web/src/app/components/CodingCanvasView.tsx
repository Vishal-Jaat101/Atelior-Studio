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
      {/* Running Pipeline Status */}
      <div className="p-4 bg-zinc-900 text-zinc-100 rounded border border-zinc-800 flex items-center justify-between gap-4 shadow-md font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider">CoderAgent Engine Active</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-zinc-400">
          <div>PIPELINE: Sequential Execution Loop</div>
          <div>STATUS: Synthesizing Components</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Task pipeline and Explorer */}
        <div className="col-span-12 md:col-span-4 space-y-6 flex flex-col">
          {/* Active Task Queue */}
          <div className="bg-white p-5 rounded border border-zinc-200 space-y-4 shadow-3xs flex-1">
            <h3 className="text-xs font-bold text-zinc-900 border-b pb-2 uppercase tracking-wide">
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
                    className={`p-3 rounded border text-xs flex items-center justify-between gap-3 ${
                      isRunning 
                        ? 'border-indigo-200 bg-indigo-50/50' 
                        : isCompleted 
                        ? 'border-emerald-200 bg-emerald-50/10' 
                        : isFailed 
                        ? 'border-red-200 bg-red-50/10' 
                        : 'border-zinc-200 bg-zinc-50/30'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-mono text-[9px] text-zinc-500 uppercase">{task.id}</div>
                      <div className="font-bold text-zinc-800 truncate">
                        {task.payload?.title || 'Synthesis Task'}
                      </div>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border ${
                        isRunning
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200 animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : isFailed
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-zinc-100 text-zinc-500 border-zinc-200'
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
          <div className="bg-white p-5 rounded border border-zinc-200 space-y-3 shadow-3xs">
            <h3 className="text-xs font-bold text-zinc-900 border-b pb-2 uppercase tracking-wide">
              Explorer Workspace
            </h3>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 font-mono text-[11px]">
              {filesList.length === 0 ? (
                <div className="text-zinc-400 py-2 italic text-center">No files synthesized yet.</div>
              ) : (
                filesList.map((file) => {
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <button
                      type="button"
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left p-2 rounded flex items-center gap-2 hover:bg-zinc-50 transition-all ${
                        isSelected ? 'bg-zinc-100 font-bold border border-zinc-200 shadow-3xs' : 'border border-transparent'
                      }`}
                    >
                      <span className="text-xs">📄</span>
                      <span className="truncate text-zinc-700" title={file.path}>
                        {file.path.split('/').pop()}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Code Editor canvas */}
        <div className="col-span-12 md:col-span-8 bg-zinc-900 rounded border border-zinc-800 flex flex-col shadow-lg overflow-hidden min-h-[500px]">
          {/* Editor Header */}
          <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between font-mono text-[10px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 truncate text-zinc-300" title={selectedFile?.path || 'Untitled'}>
                {selectedFile?.path || 'workspace_empty.ts'}
              </span>
            </div>
            <span>TypeScript // React</span>
          </div>

          {/* Editor Canvas */}
          <div className="flex-1 p-4 font-mono text-xs overflow-auto text-zinc-300 leading-relaxed shadow-inner">
            {selectedFile ? (
              <pre className="whitespace-pre">
                <code>{selectedFile.content}</code>
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 italic space-y-2">
                <span>⚡ CoderAgent is writing files...</span>
                <span className="text-[10px] uppercase font-mono tracking-widest bg-zinc-800 px-2 py-0.5 rounded not-italic">
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
