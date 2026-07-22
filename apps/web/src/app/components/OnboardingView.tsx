'use client';

import React from 'react';
import IngestionDropzone from './IngestionDropzone';

interface OnboardingViewProps {
  initialPrompt: string;
  setInitialPrompt: (val: string) => void;
  loading: boolean;
  uploadedFiles: File[];
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  handleFilesSelected: (files: FileList | File[]) => void;
  removeFile: (name: string) => void;
  getFileIcon: (type: string) => string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleStartDiscovery: (prompt: string) => void;
  onboardingPrompts: string[];
  tokens: any;
}

export default function OnboardingView({
  initialPrompt,
  setInitialPrompt,
  loading,
  uploadedFiles,
  isDragging,
  setIsDragging,
  handleFilesSelected,
  removeFile,
  getFileIcon,
  fileInputRef,
  handleStartDiscovery,
  onboardingPrompts,
  tokens
}: OnboardingViewProps) {
  return (
    <div className="grid grid-cols-12 gap-8 w-full max-w-5xl mx-auto py-10 select-text">
      {/* Left Column: Intake title & parameters */}
      <div className="col-span-12 md:col-span-5 flex flex-col justify-center space-y-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#28456B] bg-[#28456B]/10 px-2 py-0.5 rounded">
            Stage A // Discovery &amp; Scope
          </span>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 mt-2 leading-none uppercase">
            Product Intake<br />Interview
          </h1>
          <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
            Provide a simple statement or drop product photos, PRDs, and references. The PM agent will ingest files, map variables, and interview you to build a custom Living Brief.
          </p>
        </div>

        <div className="border-l-2 border-[#28456B]/30 pl-4 py-1 space-y-2 font-mono text-[10px] text-zinc-500">
          <div>MODEL: Nemotron-70b-instruct [ACTIVE]</div>
          <div>GATEWAY_PIPELINE: Direct DB Route Handlers</div>
          <div>WORKSPACE: @atelier/web // @atelier/agents</div>
        </div>
      </div>

      {/* Right Column: Technical Drafting Onboarding Card */}
      <div className="col-span-12 md:col-span-7 space-y-6">
        <div className="relative">
          <div className="absolute -top-6 left-2 font-mono text-[9px] text-zinc-400 select-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#28456B] rounded-full inline-block" />
            SPEC_02 // SYSTEM_INTAKE_PROMPT
          </div>

          <div
            className="p-6 rounded border-2 border-dashed bg-white shadow-sm flex flex-col space-y-4 relative"
            style={{ borderColor: tokens.colors.pencil400 + '55' }}
          >
            {/* Sub-ticks for card corners */}
            <span className="absolute top-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
            <span className="absolute top-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
            <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
            <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>

            <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 tracking-wider">PROJECT STATEMENT</label>
            <textarea
              rows={3}
              placeholder="e.g. A marketplace for vintage mid-century furniture with interactive 3D viewers for product listings..."
              className="w-full bg-transparent resize-none outline-none border-b border-transparent focus:border-zinc-300 py-1 transition-all text-xs leading-relaxed"
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
            />

            {/* Ingestion Dropzone */}
            <IngestionDropzone
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              uploadedFiles={uploadedFiles}
              handleFilesSelected={handleFilesSelected}
              removeFile={removeFile}
              getFileIcon={getFileIcon}
              fileInputRef={fileInputRef}
              tokens={tokens}
            />

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleStartDiscovery(initialPrompt)}
                disabled={loading || !initialPrompt.trim()}
                className="px-5 py-2.5 rounded font-bold text-xs uppercase transition-all tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-95"
                style={{
                  backgroundColor: tokens.colors.blueprint600,
                  color: tokens.colors.paper050
                }}
              >
                {loading
                  ? (uploadedFiles.length > 0 ? 'Analyzing Files...' : 'Booting Agent...')
                  : (uploadedFiles.length > 0
                    ? `Launch Discovery + Ingest ${uploadedFiles.length} File(s)`
                    : 'Launch Discovery')}
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block tracking-wider">Suggested Starters:</span>
          <div className="flex flex-col gap-2">
            {onboardingPrompts.map((p, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => {
                  setInitialPrompt(p);
                  handleStartDiscovery(p);
                }}
                className="text-left p-3 rounded border border-zinc-200 bg-white hover:bg-zinc-50 transition-all text-xs text-zinc-700 hover:text-black leading-relaxed shadow-2xs hover:border-[#28456B]/30"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
