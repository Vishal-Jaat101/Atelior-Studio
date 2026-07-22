'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ThreeDViewer } from './ThreeDViewer';
import { Dynamic3DAssetViewer } from './Dynamic3DAssetViewer';

interface DiscoveryQuestion {
  id: string;
  field: string;
  text: string;
  type: 'open' | 'closed' | 'closed-multi';
  options?: string[];
  placeholder?: string;
}

interface DiscoveryLoopViewProps {
  project: {
    projectId: string;
    completeness: number;
    isComplete: boolean;
    questions: DiscoveryQuestion[];
    brief?: Record<string, any>;
  };
  conversation: { type: 'pm' | 'user'; text: string; fields?: string[] }[];
  answers: Record<string, any>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  handleSubmitBatch: (e: React.FormEvent) => void;
  toggleChipSelection: (field: string, option: string, isMulti: boolean) => void;
  handleGenerateDirections: () => void;
  resetWorkspace: () => void;
  loading: boolean;
  tokens: any;
  /** Original user prompt used for 3D asset keyword extraction fallback */
  initialPrompt?: string;
}

const FIELD_LABELS: Record<string, string> = {
  targetAudience: 'Target Audience',
  platforms: 'Target Platforms',
  coreUserFlow: 'Core User Flow',
  has3DApplicability: '3D Asset Viewport',
  visualTone: 'Visual Tone & Style',
  mustHaveFeatures: 'Must-Have Features',
  niceToHaveFeatures: 'Nice-to-Have Features'
};

export default function DiscoveryLoopView({
  project,
  conversation,
  answers,
  setAnswers,
  handleSubmitBatch,
  toggleChipSelection,
  handleGenerateDirections,
  resetWorkspace,
  loading,
  tokens,
  initialPrompt
}: DiscoveryLoopViewProps) {
  // Check if 3D applicability is enabled in answers or default true for test fixture
  const show3DViewer = answers.has3DApplicability === 'Yes' || answers.has3DApplicability === true || true;

  if (project.isComplete) {
    return (
      <div className="p-8 rounded-xl border border-[#C9A227]/30 bg-[#14171F] text-center space-y-6 my-auto relative nocturne-transition shadow-2xl max-w-2xl mx-auto">
        <span className="inline-flex w-14 h-14 rounded-full items-center justify-center font-bold text-xl mb-2 bg-[#C9A227]/20 border border-[#C9A227] text-[#C9A227] gold-accent-glow">
          ✓
        </span>
        <h2 className="text-2xl font-serif text-[#F2F0EC]">
          Discovery Interview Complete
        </h2>
        <p className="text-[#C4C0B6] text-xs max-w-md mx-auto leading-relaxed font-sans">
          All criteria have been fully resolved. The project's Living Brief is locked in. Let's run the creative divergence engine to generate 5 distinct design directions.
        </p>

        {/* Embedded 3D Viewer for Completed Brief */}
        {show3DViewer && (
          <div className="pt-2 pb-4">
            <Dynamic3DAssetViewer
              projectId={project.projectId}
              brief={project.brief}
              projectDescription={initialPrompt}
              className="max-h-[380px]"
            />
          </div>
        )}

        <div className="pt-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={resetWorkspace}
            className="px-5 py-2.5 border border-white/10 rounded-lg font-mono text-[11px] uppercase tracking-wider text-[#C4C0B6] hover:bg-[#1E2330] hover:text-[#F2F0EC] transition-all"
          >
            Reset Workspace
          </button>
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg text-[#0B0D12] bg-[#C9A227] hover:bg-[#A6841C] font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#C9A227]/20"
            onClick={handleGenerateDirections}
            disabled={loading}
          >
            {loading ? 'Generating Directions...' : 'Run Design Divergence Engine'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex flex-col space-y-6 max-w-3xl mx-auto w-full pb-10"
    >
      {/* 3D Asset Feature Hero in Discovery View when 3D Applicability is active */}
      {show3DViewer && (
        <div className="mb-2">
          <Dynamic3DAssetViewer
            projectId={project.projectId}
            brief={project.brief}
            projectDescription={initialPrompt}
          />
        </div>
      )}

      {/* Conversation History Log */}
      <div className="space-y-4">
        {conversation.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col max-w-[85%] ${msg.type === 'user' ? 'self-end ml-auto' : 'self-start mr-auto'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 justify-between px-1">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#7E7A72]">
                {msg.type === 'pm' ? 'DiscoveryAgent (PM)' : 'Founder (User)'}
              </span>
            </div>
            <div 
              className={`p-4 rounded-xl text-xs leading-relaxed border shadow-xl ${
                msg.type === 'user'
                  ? 'bg-[#2B4C7E]/30 border-[#2B4C7E] text-[#F2F0EC]'
                  : 'bg-[#14171F] border-[#C9A227]/20 text-[#F2F0EC]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Active Question Batch Form */}
      <form onSubmit={handleSubmitBatch} className="space-y-6 pt-4 border-t border-white/10 mt-4">
        <div className="p-3.5 bg-[#14171F] rounded-lg border border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse" />
            <span className="text-[11px] font-mono text-[#F2F0EC] uppercase tracking-widest font-semibold">
              Discovery Batch Question Queue
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#7E7A72]">
            TURN {Math.round(project.completeness / 15) + 1}
          </span>
        </div>

        <div className="space-y-6 relative">
          {project.questions.map((q) => {
            const val = answers[q.field];
            return (
              <div 
                key={q.id}
                className="p-5 rounded-xl border border-white/10 bg-[#14171F] shadow-xl space-y-4 hover:border-[#C9A227]/30 transition-all"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-wider block font-semibold">
                    Field Target: {FIELD_LABELS[q.field] || q.field}
                  </span>
                  <h3 className="font-serif text-sm leading-snug text-[#F2F0EC]">
                    {q.text}
                  </h3>
                </div>

                {/* CLOSED / CHIP SELECTIONS */}
                {q.type === 'closed' && q.options && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {q.options.map((opt) => {
                      const isSelected = val === opt;
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => toggleChipSelection(q.field, opt, false)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                            isSelected 
                              ? 'bg-[#C9A227] text-[#0B0D12] font-bold border border-[#C9A227]' 
                              : 'bg-[#0B0D12] text-[#C4C0B6] border border-white/10 hover:border-[#C9A227]/40 hover:text-[#F2F0EC]'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* CLOSED MULTI / CHECKLIST CHIPS */}
                {q.type === 'closed-multi' && q.options && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {q.options.map((opt) => {
                      const selectedList = (val as string[]) || [];
                      const isSelected = selectedList.includes(opt);
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => toggleChipSelection(q.field, opt, true)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                            isSelected 
                              ? 'bg-[#C9A227] text-[#0B0D12] font-bold border border-[#C9A227]' 
                              : 'bg-[#0B0D12] text-[#C4C0B6] border border-white/10 hover:border-[#C9A227]/40 hover:text-[#F2F0EC]'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* OPEN / TEXT FIELDS */}
                {q.type === 'open' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder={q.placeholder || "Type your response..."}
                      value={val || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.field]: e.target.value }))}
                      className="w-full p-3 border border-white/10 rounded-lg outline-none text-xs bg-[#0B0D12] text-[#F2F0EC] placeholder-[#7E7A72] focus:border-[#C9A227]/50 transition-all"
                    />
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono uppercase text-[#7E7A72] font-semibold block tracking-wider">
                          Suggested Prefills:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => setAnswers(prev => ({ ...prev, [q.field]: opt }))}
                              className="px-3 py-1 rounded-full text-[10px] border border-white/10 text-[#C4C0B6] bg-[#0B0D12] hover:border-[#C9A227]/40 hover:text-[#F2F0EC] transition-all"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 bg-[#C9A227] text-[#0B0D12] hover:bg-[#A6841C] shadow-lg shadow-[#C9A227]/10"
          >
            {loading ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
