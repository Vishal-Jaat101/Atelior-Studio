'use client';

import React, { useState } from 'react';
import { tokens } from '@atelier/design-system';

export default function WorkspacePage() {
  const [tasks, setTasks] = useState([
    { id: '1', name: 'Discovery interview completed', status: 'done', agent: 'DiscoveryAgent' },
    { id: '2', name: 'Implementation plan approved', status: 'done', agent: 'ArchitectAgent' },
    { id: '3', name: 'Generate rebellious design tokens', status: 'done', agent: 'DesignAgent' },
    { id: '4', name: 'Retrieve CC sneaker model from Sketchfab', status: 'running', agent: 'AssetAgent' },
    { id: '5', name: 'Build product grid screen', status: 'pending', agent: 'FrontendCoderAgent' },
    { id: '6', name: 'Verify page rendering contrast ratio', status: 'pending', agent: 'QAAgent' }
  ]);

  const [activeTask, setActiveTask] = useState('4');

  return (
    <main 
      className="flex h-screen w-screen overflow-hidden font-sans text-sm"
      style={{
        backgroundColor: tokens.colors.canvasBackground,
        color: tokens.colors.textPrimary,
        fontFamily: tokens.typography.brandFonts.body
      }}
    >
      {/* 1. Left Sidebar - Workspace Task Tracker */}
      <div 
        className="flex flex-col w-80 h-full border-r"
        style={{
          backgroundColor: tokens.colors.sidebarBackground,
          borderColor: tokens.colors.sidebarBorder
        }}
      >
        {/* Workspace Brand Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: tokens.colors.sidebarBorder }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs"
              style={{
                background: `linear-gradient(135deg, ${tokens.colors.primaryAccent}, ${tokens.colors.secondaryAccent})`
              }}
            >
              A
            </div>
            <span className="font-semibold tracking-wider uppercase text-xs">Atelier Studio</span>
          </div>
          <span 
            className="px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-tight"
            style={{
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              color: tokens.colors.secondaryAccent
            }}
          >
            v0.1
          </span>
        </div>

        {/* Task rail */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider mb-2">Build Task Queue</div>
          {tasks.map((task) => {
            const isSelected = task.id === activeTask;
            return (
              <div 
                key={task.id}
                onClick={() => setActiveTask(task.id)}
                className={`p-3 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                  isSelected ? 'border-zinc-700' : 'border-transparent hover:bg-zinc-900/50'
                }`}
                style={{
                  backgroundColor: isSelected ? tokens.colors.cardBackground : 'transparent',
                  backdropFilter: isSelected ? `blur(${tokens.layout.glassmorphism.blur})` : 'none'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-zinc-400">{task.agent}</span>
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: 
                        task.status === 'done' ? tokens.colors.status.success :
                        task.status === 'running' ? tokens.colors.status.warning : 
                        '#3f3f46'
                    }}
                  />
                </div>
                <div className="text-zinc-200 font-medium leading-relaxed">{task.name}</div>
              </div>
            );
          })}
        </div>

        {/* Agent Activity Console Logs */}
        <div 
          className="h-44 border-t p-4 font-mono text-[11px] overflow-y-auto space-y-1.5 bg-zinc-950/60"
          style={{ borderColor: tokens.colors.sidebarBorder }}
        >
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Agent Process Logs</div>
          <div className="text-zinc-400">&gt; DiscoveryAgent initialized...</div>
          <div className="text-zinc-400">&gt; Living Brief compiled successfully.</div>
          <div className="text-zinc-400">&gt; Proposing token palette: Rebellious Dark.</div>
          <div className="text-cyan-400 animate-pulse">&gt; AssetAgent: Sourcing models matching "sneaker" from Sketchfab...</div>
        </div>
      </div>

      {/* 2. Main Center/Right - Interactive Preview Canvas */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950">
        {/* Preview Control Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b bg-zinc-900/40"
          style={{ borderColor: tokens.colors.sidebarBorder }}
        >
          <div className="flex items-center gap-4">
            <span className="font-medium text-zinc-300">Live Preview: Vintage Sneaker store</span>
            <span className="text-xs text-zinc-500 font-mono">localhost:3000</span>
          </div>
          <button 
            className="px-4 py-2 rounded font-semibold text-xs tracking-wide transition-all uppercase"
            style={{
              background: `linear-gradient(135deg, ${tokens.colors.primaryAccent}, #8b5cf6)`,
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
            }}
          >
            Deploy to Production
          </button>
        </div>

        {/* The Sandbox Execution View Screen */}
        <div className="flex-1 p-8 flex items-center justify-center bg-zinc-900/20">
          <div 
            className="w-full h-full rounded-xl border flex flex-col overflow-hidden shadow-2xl relative bg-zinc-950"
            style={{ borderColor: tokens.colors.sidebarBorder }}
          >
            {/* Embedded mockup sneaker page with canvas 3D placeholder */}
            <div className="flex-1 flex flex-col bg-[#0b0b0f] text-white">
              {/* Navbar */}
              <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-800/80">
                <span className="font-bold tracking-wider text-sm uppercase">KICKKRAFT</span>
                <div className="flex gap-6 text-xs text-zinc-400">
                  <a className="hover:text-white">Shop</a>
                  <a className="hover:text-white">Editorial</a>
                  <a className="hover:text-white">Cart (0)</a>
                </div>
              </nav>

              {/* Sneaker hero */}
              <div className="flex-1 flex items-center justify-between px-16 relative">
                <div className="max-w-md z-10 space-y-6">
                  <span className="text-xs text-red-500 font-bold uppercase tracking-widest">Limited Edition</span>
                  <h1 className="text-4xl font-extrabold tracking-tight uppercase leading-none">
                    Retro Rebel <br/>
                    <span style={{ color: tokens.colors.primaryAccent }}>V1 Sneaker</span>
                  </h1>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Designed with an asymmetric, premium leather outline and decoupled shock absorbers. Made for collectors, worn by rebels.
                  </p>
                  <button className="px-6 py-3 border border-white text-xs font-bold uppercase hover:bg-white hover:text-black transition-all">
                    Pre-Order Now
                  </button>
                </div>

                {/* Simulated 3D Sneaker orbit canvas */}
                <div className="flex-1 h-full max-h-[400px] flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-radial-gradient from-zinc-800/20 to-transparent pointer-events-none" />
                  <div className="w-80 h-80 rounded-full border border-zinc-800/50 border-dashed flex items-center justify-center animate-spin" style={{ animationDuration: '30s' }}>
                    <div className="w-64 h-64 rounded-full border border-zinc-700/30 border-dashed" />
                  </div>
                  <div 
                    className="absolute font-mono text-[11px] px-3 py-1.5 rounded border flex items-center gap-2 bg-black/80"
                    style={{ borderColor: tokens.colors.secondaryAccent, color: tokens.colors.secondaryAccent }}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    [3D Canvas: Sneaker model rendering]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
