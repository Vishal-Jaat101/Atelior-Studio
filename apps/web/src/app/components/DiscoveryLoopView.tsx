'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
}

const FIELD_LABELS: Record<string, string> = {
  targetAudience: 'Target Audience',
  platforms: 'Target Platforms',
  coreUserFlow: 'Core User Flow',
  has3DApplicability: '3D Rendering',
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
  tokens
}: DiscoveryLoopViewProps) {
  if (project.isComplete) {
    return (
      <div className="p-8 rounded border-2 border-dashed bg-white text-center space-y-4 my-auto relative" style={{ borderColor: tokens.colors.status.success + '88' }}>
        <span className="absolute top-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
        <span className="absolute top-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
        <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
        <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>

        <span 
          className="inline-flex w-12 h-12 rounded-full items-center justify-center font-bold text-lg mb-2"
          style={{
            backgroundColor: tokens.colors.status.success + '22',
            color: tokens.colors.status.success
          }}
        >
          ✓
        </span>
        <h2 className="text-xl font-bold" style={{ color: tokens.colors.status.success }}>
          Discovery Interview Complete!
        </h2>
        <p className="text-zinc-600 text-xs max-w-md mx-auto leading-relaxed">
          All criteria have been fully resolved. The project's Living Brief is locked in. Let's run the creative divergence engine to generate design variations.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={resetWorkspace}
            className="px-4 py-2 border rounded font-mono text-[10px] uppercase hover:bg-zinc-50"
            style={{ borderColor: tokens.colors.pencil400 }}
          >
            Reset Workspace
          </button>
          <button
            type="button"
            className="px-5 py-2.5 rounded text-white font-bold text-xs uppercase tracking-wide hover:brightness-95 transition-all"
            style={{ backgroundColor: tokens.colors.blueprint600 }}
            onClick={handleGenerateDirections}
            disabled={loading}
          >
            {loading ? 'Generating Directions...' : 'Run Design Divergence'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col space-y-6 max-w-2xl mx-auto w-full pb-10"
    >
      {/* Conversation History log */}
      <div className="space-y-4">
        {conversation.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col max-w-[85%] ${msg.type === 'user' ? 'self-end ml-auto' : 'self-start mr-auto'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 justify-between px-1">
              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                {msg.type === 'pm' ? 'DiscoveryAgent (PM)' : 'Founder (User)'}
              </span>
            </div>
            <div 
              className="p-4 rounded text-xs leading-relaxed border shadow-2xs relative"
              style={{
                backgroundColor: msg.type === 'user' ? tokens.colors.blueprint600 : '#ffffff',
                color: msg.type === 'user' ? tokens.colors.paper050 : tokens.colors.ink900,
                borderColor: msg.type === 'user' ? tokens.colors.blueprint600 : tokens.colors.pencil400 + '33'
              }}
            >
              {/* Subticks in corners for layout logs */}
              <span className="absolute top-0.5 left-1 text-[8px] opacity-25 font-mono select-none">+</span>
              <span className="absolute top-0.5 right-1 text-[8px] opacity-25 font-mono select-none">+</span>
              <span className="absolute bottom-0.5 left-1 text-[8px] opacity-25 font-mono select-none">+</span>
              <span className="absolute bottom-0.5 right-1 text-[8px] opacity-25 font-mono select-none">+</span>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Active Question Batch Form */}
      <form onSubmit={handleSubmitBatch} className="space-y-6 pt-4 border-t mt-4" style={{ borderColor: tokens.colors.pencil400 + '33' }}>
        <div className="p-3 bg-zinc-100 rounded border flex items-center justify-between gap-2 border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">Discovery Batch Question Queue</span>
          </div>
          <span className="text-[8px] font-mono text-zinc-400">TURN {Math.round(project.completeness / 15) + 1}</span>
        </div>

        <div className="space-y-6 relative">
          {/* Floating Spec Label Pointing to Queue */}
          <div className="absolute -top-12 -left-16 hidden lg:flex items-center gap-1 pointer-events-none font-mono text-[9px] text-zinc-400 select-none">
            <span>[SPEC_03 // ACTIVE_BATCH_FIELD]</span>
            <svg width="35" height="15" className="opacity-45">
              <line x1="0" y1="7" x2="30" y2="7" stroke="#8A93A3" strokeWidth="0.8" strokeDasharray="2,2" />
              <circle cx="30" cy="7" r="1.5" fill="#8A93A3" />
            </svg>
          </div>

          {project.questions.map((q) => {
            const val = answers[q.field];
            return (
              <div 
                key={q.id}
                className="p-5 rounded border bg-white shadow-2xs space-y-4 relative"
                style={{ borderColor: tokens.colors.pencil400 + '44' }}
              >
                {/* Card Ticks */}
                <span className="absolute top-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
                <span className="absolute top-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
                <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>
                <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-zinc-300 pointer-events-none select-none">[+]</span>

                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">
                    Field Target: {FIELD_LABELS[q.field] || q.field}
                  </span>
                  <h3 className="font-semibold text-xs leading-normal" style={{ color: tokens.colors.ink900 }}>
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
                          className={`px-3 py-1.5 rounded text-xs border font-medium transition-all ${
                            isSelected 
                              ? 'border-transparent text-white' 
                              : 'border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 shadow-2xs'
                          }`}
                          style={{
                            backgroundColor: isSelected ? tokens.colors.blueprint600 : undefined
                          }}
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
                          className={`px-3 py-1.5 rounded text-xs border font-medium transition-all ${
                            isSelected 
                              ? 'border-transparent text-white' 
                              : 'border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 shadow-2xs'
                          }`}
                          style={{
                            backgroundColor: isSelected ? tokens.colors.blueprint600 : undefined
                          }}
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
                      className="w-full p-2.5 border rounded outline-none text-xs transition-all bg-zinc-50 focus:bg-white"
                      style={{ borderColor: tokens.colors.pencil400 + '66' }}
                    />
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono uppercase text-zinc-400 font-bold block tracking-wider">Suggested Prefills:</span>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt) => (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => setAnswers(prev => ({ ...prev, [q.field]: opt }))}
                              className="px-2.5 py-1 rounded-full text-[10px] border border-zinc-200 text-zinc-600 bg-zinc-50 hover:bg-zinc-100 transition-all shadow-3xs"
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
            className="px-5 py-2.5 rounded font-bold text-xs uppercase transition-all tracking-wider disabled:opacity-40 hover:brightness-95"
            style={{
              backgroundColor: tokens.colors.blueprint600,
              color: tokens.colors.paper050
            }}
          >
            {loading ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
