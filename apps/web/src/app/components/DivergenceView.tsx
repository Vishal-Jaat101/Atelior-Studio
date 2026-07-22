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
      <div className="p-8 rounded border-2 border-dashed bg-white text-center space-y-6 my-auto relative" style={{ borderColor: tokens.colors.status.success + '88' }}>
        <span className="absolute top-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
        <span className="absolute top-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
        <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
        <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>

        <div className="space-y-2">
          <span className="inline-flex w-12 h-12 rounded-full items-center justify-center font-bold text-lg"
            style={{
              backgroundColor: tokens.colors.status.success + '22',
              color: tokens.colors.status.success
            }}
          >
            ✓
          </span>
          <h2 className="text-xl font-bold" style={{ color: tokens.colors.status.success }}>
            Design Direction Set!
          </h2>
          <p className="text-zinc-600 text-xs max-w-md mx-auto leading-relaxed">
            You selected the <strong className="uppercase">{selectedDirection.axis}</strong> paradigm. The design tokens have been written to the database. We are ready to build the architecture.
          </p>
        </div>

        {/* Show Swatch Preview of Chosen Direction */}
        <div className="p-4 rounded border bg-zinc-50 border-zinc-200 text-left space-y-3 max-w-sm mx-auto font-mono text-[11px]">
          <div className="flex items-center justify-between border-b pb-2 border-zinc-200">
            <span className="font-bold uppercase text-[10px]">Active Design Tokens</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 text-[9px] uppercase">{selectedDirection.axis}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Heading:</span>
            <span className="font-bold">{selectedDirection.tokenPreview?.typography?.headingFont}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Palette:</span>
            <div className="flex gap-1">
              {Object.values(selectedDirection.tokenPreview?.colors || {}).map((c: any, i) => (
                <span key={i} className="w-4 h-4 rounded border border-zinc-300 inline-block" style={{ backgroundColor: c }} title={c} />
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
            className="px-4 py-2 border rounded font-mono text-[10px] uppercase hover:bg-zinc-50"
            style={{ borderColor: tokens.colors.pencil400 }}
          >
            Change Direction
          </button>
          <button
            type="button"
            className="px-5 py-2 rounded text-white font-bold text-xs uppercase tracking-wide hover:brightness-95 transition-all"
            style={{ backgroundColor: tokens.colors.blueprint600 }}
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
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#28456B] bg-[#28456B]/10 px-2.5 py-1 rounded">
          Divergence Specialist (Creative Gate)
        </span>
        <h2 className="text-2xl font-bold uppercase" style={{ color: tokens.colors.blueprint600, fontFamily: tokens.typography.brandFonts?.title || 'inherit' }}>
          Pick design direction
        </h2>
        <p className="text-zinc-500 text-xs max-w-md mx-auto">
          Two custom directions survived the Design Agent's anti-generic critique check. Choose one to start building.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {designDirections.map((dir) => (
          <div 
            key={dir.id}
            className="bg-white rounded border-2 p-6 flex flex-col justify-between space-y-6 relative shadow-sm hover:border-[#28456B]/50 transition-all"
            style={{ borderColor: tokens.colors.pencil400 + '33' }}
          >
            <span className="absolute top-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
            <span className="absolute top-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: tokens.colors.pencil400 + '15' }}>
                <div>
                  <h3 className="font-bold text-sm uppercase" style={{ color: tokens.colors.blueprint600 }}>{dir.name}</h3>
                  <span className="text-[9px] font-mono text-zinc-400">AXIS: {dir.axis.toUpperCase()}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                  SURVIVED
                </span>
              </div>

              <p className="text-zinc-600 text-xs leading-relaxed">{dir.description}</p>

              {/* swatches & font details */}
              <div className="p-4 rounded bg-zinc-50 space-y-3 font-mono text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Typography:</span>
                  <span className="font-bold text-zinc-800">{dir.tokenPreview.typography.headingFont} + {dir.tokenPreview.typography.bodyFont}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Color Palette:</span>
                  <div className="flex gap-1.5">
                    {Object.values(dir.tokenPreview.colors).map((color: any, i) => (
                      <span key={i} className="w-5 h-5 rounded border border-zinc-200 block shadow-3xs" style={{ backgroundColor: color }} title={color} />
                    ))}
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-200/50">
                  <span className="text-zinc-400 block mb-1">Critique Report:</span>
                  <span className="text-[9px] text-zinc-500 italic leading-snug block">"{dir.critiqueFeedback}"</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectDirection(dir.id)}
              className="w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider text-white hover:brightness-95 transition-all"
              style={{ backgroundColor: tokens.colors.blueprint600 }}
            >
              Select Direction
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setDesignDirections(null)}
          className="text-zinc-500 hover:text-black font-mono text-[10px] uppercase border-b border-transparent hover:border-black transition-all"
        >
          Back to Interview Summary
        </button>
      </div>
    </div>
  );
}
