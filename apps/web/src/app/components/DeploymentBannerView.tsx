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
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-6 rounded border-2 border-emerald-500 bg-emerald-500/5 backdrop-blur-md text-center space-y-5 relative shadow-md"
    >
      {/* Celebrate Banner */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">
          🚀 Project Deployed Successfully
        </h2>
        <p className="text-zinc-600 text-xs">
          The multi-agent pipeline completed all compliance checks and finalized production compilation!
        </p>
      </div>

      {/* Simulated Browser Sandbox */}
      <div className="border border-zinc-300 rounded overflow-hidden shadow-sm bg-white text-left font-sans text-xs">
        {/* Address Bar */}
        <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 block" />
            </span>
            <span className="bg-white border px-3 py-0.5 rounded w-80 truncate block">
              {deploymentInfo.url}
            </span>
          </div>
          <span className="font-bold text-emerald-600">SSL ENCRYPTED</span>
        </div>

        {/* Render Preview using Selected Tokens */}
        <div 
          className="p-6 text-center space-y-6 transition-all duration-300"
          style={{
            backgroundColor: selectedDirection?.tokenPreview?.colors?.background || '#fcfbf9',
            color: selectedDirection?.tokenPreview?.colors?.textPrimary || '#161b22',
            fontFamily: selectedDirection?.tokenPreview?.typography?.bodyFont || 'sans-serif'
          }}
        >
          <div className="max-w-md mx-auto space-y-4">
            <h1 
              className="text-3xl font-extrabold uppercase leading-none"
              style={{
                fontFamily: selectedDirection?.tokenPreview?.typography?.headingFont || 'sans-serif',
                color: selectedDirection?.tokenPreview?.colors?.accentPrimary || '#28456B'
              }}
            >
              {activeHeroCopy}
            </h1>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Experience historical curated designs paired with modern digital convenience. Deployed successfully to the cloud.
            </p>
            
            <button
              type="button"
              className="px-5 py-2.5 rounded font-extrabold text-xs uppercase tracking-wider transition-all"
              style={{
                backgroundColor: selectedDirection?.tokenPreview?.colors?.accentPrimary || '#28456B',
                color: selectedDirection?.tokenPreview?.colors?.background || '#ffffff'
              }}
            >
              {activeCtaText}
            </button>
          </div>
        </div>
      </div>

      {/* Actions block */}
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleDownloadCode}
          className="px-4 py-2 border rounded font-mono text-[10px] uppercase bg-white border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-50 shadow-3xs"
        >
          📥 Download Source Code (.TXT)
        </button>
        <a 
          href={deploymentInfo.url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 rounded font-mono text-[10px] uppercase font-bold text-white shadow-3xs block bg-emerald-600 hover:bg-emerald-700"
        >
          🔗 Open Production Preview
        </a>
        <button
          type="button"
          onClick={handleGeneratePitch}
          disabled={isPitchGenerating}
          className="px-4 py-2 rounded font-mono text-[10px] uppercase font-bold text-white shadow-3xs bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isPitchGenerating ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
              Generating Pitch...
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
          className="mt-5 p-5 rounded border border-violet-300 bg-violet-50/30 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-violet-900 uppercase tracking-wide flex items-center gap-2">
              <span>🎬</span> Auto-Generated Pitch Video
            </h3>
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 rounded font-mono text-[8px] uppercase font-bold">
              {pitchVideo.durationSeconds}s
            </span>
          </div>

          <div className="rounded overflow-hidden border border-violet-200 shadow-sm bg-black">
            <video
              controls
              autoPlay
              className="w-full"
              style={{ maxHeight: '360px' }}
              src={pitchVideo.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Voiceover Script Transcript */}
          <div className="space-y-2">
            <div className="text-[9px] font-mono uppercase text-violet-600 font-bold tracking-wider">Voiceover Script</div>
            <div className="bg-white p-3 rounded border border-violet-200 text-xs text-zinc-700 leading-relaxed max-h-24 overflow-y-auto">
              {pitchVideo.script}
            </div>
          </div>
        </motion.div>
      )}

      {/* Pitch Generation Logs */}
      {pitchLogs.length > 0 && (
        <div className="mt-3 bg-zinc-900 text-zinc-300 p-3 rounded font-mono text-[9px] leading-relaxed max-h-32 overflow-y-auto">
          <div className="text-zinc-500 uppercase border-b border-zinc-800 pb-1 mb-1 font-bold">Pitch Pipeline Logs</div>
          {pitchLogs.map((log: string, idx: number) => (
            <div key={idx} className="truncate">» {log}</div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
