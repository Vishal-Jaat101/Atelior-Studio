'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ExperimentVariant {
  id: string;
  elementTargeted: string;
  status: string;
  variantContent: {
    original: string;
    variant: string;
  };
  trafficPercent: number;
}

interface DeploymentInfo {
  url: string;
}

interface DeploymentBannerViewProps {
  deploymentInfo: DeploymentInfo;
  selectedDirection: any;
  experiments: ExperimentVariant[];
  handleDownloadCode: () => void;
  handleGeneratePitch: () => void;
  isPitchGenerating: boolean;
  pitchVideo: any;
  pitchLogs: string[];
  tokens: any;
}

export default function DeploymentBannerView({
  deploymentInfo,
  selectedDirection,
  experiments,
  handleDownloadCode,
  handleGeneratePitch,
  isPitchGenerating,
  pitchVideo,
  pitchLogs,
  tokens
}: DeploymentBannerViewProps) {
  // Determine hero headline based on promoted or active experiments
  const activeHeroCopy = 
    experiments.find(e => e.elementTargeted === 'hero_copy' && e.status === 'PROMOTED')?.variantContent?.variant ||
    experiments.find(e => e.elementTargeted === 'hero_copy' && e.status === 'TESTING' && Math.random() < (e.trafficPercent / 100))?.variantContent?.variant ||
    (selectedDirection?.tokenPreview?.signatureElement === 'bold' ? 'Own the Icons of History' : 'Mid-Century Masterpieces Crafted For Collectors');

  // Determine CTA text based on promoted or active experiments
  const activeCtaText = 
    experiments.find(e => e.elementTargeted === 'cta_button_text' && e.status === 'PROMOTED')?.variantContent?.variant ||
    experiments.find(e => e.elementTargeted === 'cta_button_text' && e.status === 'TESTING' && Math.random() < (e.trafficPercent / 100))?.variantContent?.variant ||
    'Browse Masterpieces';

  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 rounded-xl border border-[#2D6A4F]/50 bg-[#14171F] text-center space-y-6 relative shadow-2xl select-text"
    >
      {/* Celebrate Banner */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#52B788] bg-[#2D6A4F]/20 border border-[#2D6A4F] px-2.5 py-1 rounded-lg inline-block">
          Pipeline Execution Complete
        </span>
        <h2 className="text-3xl font-serif text-[#F2F0EC]">
          Project Deployed Successfully
        </h2>
        <p className="text-[#C4C0B6] text-xs max-w-md mx-auto leading-relaxed font-sans">
          The multi-agent pipeline completed all compliance checks and finalized production compilation!
        </p>
      </div>

      {/* Simulated Browser Sandbox */}
      <div className="border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-[#0B0D12] text-left font-sans text-xs">
        {/* Address Bar */}
        <div className="bg-[#14171F] px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-[10px] text-[#7E7A72] font-mono">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9E2A2B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
            </span>
            <span className="bg-[#0B0D12] border border-white/10 px-3 py-1 rounded-md w-80 truncate block text-[#F2F0EC]">
              {deploymentInfo.url}
            </span>
          </div>
          <span className="font-bold text-[#52B788]">SSL ENCRYPTED</span>
        </div>

        {/* Render Preview using Nocturne Tokens */}
        <div className="p-8 text-center space-y-6 bg-[#0B0D12] text-[#F2F0EC]">
          <div className="max-w-md mx-auto space-y-4">
            <h1 className="text-3xl font-serif text-[#F2F0EC] leading-tight">
              {activeHeroCopy}
            </h1>
            <p className="text-xs text-[#C4C0B6] leading-relaxed">
              Experience historical curated designs paired with modern digital convenience. Deployed successfully to the cloud.
            </p>
            
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#A6841C] text-[#0B0D12] font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg"
            >
              {activeCtaText}
            </button>
          </div>
        </div>
      </div>

      {/* Actions Block */}
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleDownloadCode}
          className="px-4 py-2.5 rounded-lg font-mono text-[10px] uppercase bg-[#0B0D12] border border-white/10 text-[#C4C0B6] font-bold hover:border-[#C9A227]/40 hover:text-[#F2F0EC] transition-all"
        >
          📥 Download Source Code (.TXT)
        </button>
        <a 
          href={deploymentInfo.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 rounded-lg font-mono text-[10px] uppercase font-bold text-[#0B0D12] bg-[#52B788] hover:bg-[#2D6A4F] hover:text-white transition-all shadow-md block"
        >
          🔗 Open Production Preview
        </a>
        <button
          type="button"
          onClick={handleGeneratePitch}
          disabled={isPitchGenerating}
          className="px-4 py-2.5 rounded-lg font-mono text-[10px] uppercase font-bold text-[#F2F0EC] bg-[#2B4C7E] hover:bg-[#1D3559] border border-[#2B4C7E] transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {isPitchGenerating ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
              Generating Pitch Video...
            </>
          ) : (
            '🎬 Generate Pitch Video'
          )}
        </button>
      </div>

      {/* Pitch Video Player */}
      {pitchVideo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-5 rounded-xl border border-[#2B4C7E]/40 bg-[#0B0D12] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-[#9BB8E5] uppercase tracking-widest flex items-center gap-2">
              <span>🎬</span> Auto-Generated Pitch Video
            </h3>
            <span className="px-2 py-0.5 bg-[#2B4C7E]/30 text-[#9BB8E5] border border-[#2B4C7E] rounded-md font-mono text-[8px] uppercase font-bold">
              {pitchVideo.durationSeconds}s
            </span>
          </div>

          <div className="rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-black">
            <video
              controls
              autoPlay
              className="w-full"
              style={{ maxHeight: '360px' }}
              src={pitchVideo.videoUrl}
            >
              Your browser does not support video playback.
            </video>
          </div>

          {/* Voiceover Script Transcript */}
          <div className="space-y-2 text-left">
            <div className="text-[9px] font-mono uppercase text-[#C9A227] font-bold tracking-wider">Voiceover Script</div>
            <div className="bg-[#14171F] p-3 rounded-lg border border-white/10 text-xs text-[#C4C0B6] leading-relaxed max-h-24 overflow-y-auto">
              {pitchVideo.script}
            </div>
          </div>
        </motion.div>
      )}

      {/* Pitch Generation Logs */}
      {pitchLogs.length > 0 && (
        <div className="mt-3 bg-[#0B0D12] text-[#7E7A72] p-3 rounded-lg font-mono text-[9px] leading-relaxed max-h-32 overflow-y-auto border border-white/5 text-left">
          <div className="text-[#C9A227] uppercase border-b border-white/10 pb-1 mb-1 font-bold">Pitch Pipeline Logs</div>
          {pitchLogs.map((log: string, idx: number) => (
            <div key={idx} className="truncate">» {log}</div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
