'use client';

import React from 'react';

interface DesignDirection {
  id: string;
  axis: string;
  name: string;
  description: string;
  passedCritiqueGate: boolean;
  critiqueFeedback: string;
  distinctivenessScore: number;
  coherenceScore: number;
  tokenPreview: any;
}

interface DivergenceViewProps {
  designDirections: DesignDirection[];
  selectedDirection: DesignDirection | null;
  setSelectedDirection: (val: DesignDirection | null) => void;
  handleSelectDirection: (id: string) => void;
  setDesignDirections: (val: any[] | null) => void;
  handleGenerateBlueprint: () => void;
  loading: boolean;
  tokens: any;
}

export default function DivergenceView({
  designDirections,
  selectedDirection,
  setSelectedDirection,
  handleSelectDirection,
  setDesignDirections,
  handleGenerateBlueprint,
  loading,
  tokens
}: DivergenceViewProps) {
  if (selectedDirection) {
    return (
      <div className="p-8 rounded-xl border border-[#C9A227]/40 bg-[#14171F] text-center space-y-6 my-auto relative shadow-2xl max-w-2xl mx-auto nocturne-transition">
        <div className="space-y-3">
          <span className="inline-flex w-14 h-14 rounded-full items-center justify-center font-bold text-xl bg-[#C9A227]/20 border border-[#C9A227] text-[#C9A227] gold-accent-glow">
            ✓
          </span>
          <h2 className="text-2xl font-serif text-[#F2F0EC]">
            Design Direction Confirmed
          </h2>
          <p className="text-[#C4C0B6] text-xs max-w-md mx-auto leading-relaxed">
            You selected the <strong className="uppercase text-[#C9A227]">{selectedDirection.axis}</strong> paradigm. The design tokens have been written to PostgreSQL. Ready to generate system architecture.
          </p>
        </div>

        {/* Swatch Preview of Chosen Direction */}
        <div className="p-5 rounded-lg border border-white/10 bg-[#0B0D12] text-left space-y-3 max-w-sm mx-auto font-mono text-[11px]">
          <div className="flex items-center justify-between border-b pb-2 border-white/10">
            <span className="font-bold uppercase text-[10px] text-[#C9A227]">Active Design Tokens</span>
            <span className="px-2 py-0.5 rounded bg-[#2B4C7E]/40 border border-[#2B4C7E] text-[#9BB8E5] text-[9px] uppercase">
              {selectedDirection.axis}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#7E7A72]">Headline Font:</span>
            <span className="font-semibold text-[#F2F0EC]">{selectedDirection.tokenPreview?.typography?.headingFont}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#7E7A72]">Palette:</span>
            <div className="flex gap-1.5">
              {Object.values(selectedDirection.tokenPreview?.colors || {}).map((c: any, i) => (
                <span key={i} className="w-4 h-4 rounded border border-white/20 inline-block" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedDirection(null);
              setDesignDirections(null);
            }}
            className="px-5 py-2.5 border border-white/10 rounded-lg font-mono text-[10px] uppercase text-[#C4C0B6] hover:bg-[#1E2330] hover:text-[#F2F0EC] transition-all"
          >
            Change Direction
          </button>
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg text-[#0B0D12] bg-[#C9A227] hover:bg-[#A6841C] font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#C9A227]/20"
            onClick={handleGenerateBlueprint}
            disabled={loading}
          >
            {loading ? 'Analyzing Architecture...' : 'Generate System Architecture'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-auto w-full max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A227] bg-[#C9A227]/10 border border-[#C9A227]/30 px-2.5 py-1 rounded">
          Divergence Agent // Anti-Generic Critique Gate
        </span>
        <h2 className="text-3xl font-serif text-[#F2F0EC]">
          Select Design Direction
        </h2>
        <p className="text-[#C4C0B6] text-xs max-w-md mx-auto leading-relaxed">
          Surviving design directions evaluated against anti-generic critique criteria. Choose one to initialize system architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {designDirections.map((dir) => (
          <div 
            key={dir.id}
            className="bg-[#14171F] rounded-xl border border-white/10 p-6 flex flex-col justify-between space-y-6 relative shadow-xl hover:border-[#C9A227]/40 transition-all nocturne-transition group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-white/10">
                <div>
                  <h3 className="font-serif text-lg text-[#F2F0EC] group-hover:text-[#C9A227] transition-colors">{dir.name}</h3>
                  <span className="text-[9px] font-mono text-[#7E7A72]">PARADIGM: {dir.axis.toUpperCase()}</span>
                </div>
                <span className="px-2.5 py-1 rounded text-[9px] font-mono bg-[#2D6A4F]/20 border border-[#2D6A4F] text-[#52B788]">
                  CRITIQUE SURVIVOR
                </span>
              </div>

              <p className="text-[#C4C0B6] text-xs leading-relaxed">{dir.description}</p>

              {/* Swatches & Font details */}
              <div className="p-4 rounded-lg bg-[#0B0D12] space-y-3 font-mono text-[10px] border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[#7E7A72]">Typography:</span>
                  <span className="font-semibold text-[#F2F0EC]">{dir.tokenPreview.typography.headingFont} + {dir.tokenPreview.typography.bodyFont}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7E7A72]">Color Palette:</span>
                  <div className="flex gap-1.5">
                    {Object.values(dir.tokenPreview.colors).map((color: any, i) => (
                      <span key={i} className="w-5 h-5 rounded border border-white/10 block" style={{ backgroundColor: color }} title={color} />
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[#7E7A72] block mb-1">Critique Gate Evaluation:</span>
                  <span className="text-[10px] text-[#C4C0B6] italic leading-snug block">"{dir.critiqueFeedback}"</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectDirection(dir.id)}
              className="w-full py-3 rounded-lg font-mono font-bold text-xs uppercase tracking-wider bg-[#C9A227] hover:bg-[#A6841C] text-[#0B0D12] transition-all shadow-md"
            >
              Select {dir.name}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setDesignDirections(null)}
          className="text-[#7E7A72] hover:text-[#F2F0EC] font-mono text-[10px] uppercase transition-all"
        >
          ← Back to Interview Summary
        </button>
      </div>
    </div>
  );
}
