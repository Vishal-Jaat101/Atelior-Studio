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
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A227] bg-[#C9A227]/10 border border-[#C9A227]/30 px-2.5 py-1 rounded">
            Stage A // Discovery &amp; Scope
          </span>
          <h1 className="text-4xl font-serif tracking-tight text-[#F2F0EC] mt-3 leading-tight font-light">
            Product Intake <br />
            <span className="italic text-[#C9A227]">Interview</span>
          </h1>
          <p className="text-xs text-[#C4C0B6] mt-4 leading-relaxed">
            State your product vision or upload product photos, 3D references, PRDs, and specs. The Discovery Agent ingests assets, extracts parameters, and builds a Living Brief.
          </p>
        </div>

        <div className="border-l border-[#C9A227]/30 pl-4 py-1 space-y-2 font-mono text-[10px] text-[#7E7A72]">
          <div>MODEL: Nemotron-3-Super-120B [ACTIVE]</div>
          <div>ROUTER: Multi-Agent ModelRouter</div>
          <div>PALETTE: Nocturne Obsidian &amp; Antique Gold</div>
        </div>
      </div>

      {/* Right Column: Nocturne Technical Card */}
      <div className="col-span-12 md:col-span-7 space-y-6">
        <div className="relative">
          <div className="p-6 rounded-xl bg-[#14171F] border border-[#C9A227]/20 shadow-2xl flex flex-col space-y-4 relative nocturne-transition">
            <label className="text-[10px] uppercase font-mono font-semibold text-[#C9A227] tracking-wider">
              PROJECT VISION &amp; REQUIREMENT BRIEF
            </label>

            <textarea
              rows={3}
              placeholder="e.g. A marketplace for mid-century modern furniture with interactive 3D product viewports..."
              className="w-full bg-[#0B0D12]/60 text-[#F2F0EC] placeholder-[#7E7A72] resize-none outline-none border border-white/10 rounded-lg p-3 focus:border-[#C9A227]/50 transition-all text-xs leading-relaxed"
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleStartDiscovery(initialPrompt)}
                disabled={loading || !initialPrompt.trim()}
                className="px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#C9A227] hover:bg-[#A6841C] text-[#0B0D12] font-bold shadow-lg shadow-[#C9A227]/10"
              >
                {loading
                  ? (uploadedFiles.length > 0 ? 'Analyzing Assets...' : 'Booting Discovery Agent...')
                  : (uploadedFiles.length > 0
                    ? `Launch Discovery + Ingest ${uploadedFiles.length} File(s)`
                    : 'Launch Discovery Loop')}
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono text-[#7E7A72] font-semibold block tracking-wider">
            Suggested Product Starters:
          </span>
          <div className="flex flex-col gap-2">
            {onboardingPrompts.map((p, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => {
                  setInitialPrompt(p);
                  handleStartDiscovery(p);
                }}
                className="text-left p-3.5 rounded-lg border border-white/10 bg-[#14171F]/80 hover:bg-[#1E2330] hover:border-[#C9A227]/40 transition-all text-xs text-[#C4C0B6] hover:text-[#F2F0EC] leading-relaxed"
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
