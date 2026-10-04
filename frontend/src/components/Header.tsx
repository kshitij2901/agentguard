import React from 'react';

export const Header: React.FC = () => (
  <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 border border-blue-400/30">
          🛡️
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-white font-extrabold text-xl tracking-tight">AgentGuard</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700 text-[10px] font-mono tracking-wide uppercase">
              Intent-Bound Auth
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">
            Security Layer for Autonomous AI Agents · Monitoring Intent Consistency
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">
            AGENTGUARD ACTIVE
          </span>
        </div>
        <div className="text-slate-500 text-xs hidden sm:block">
          Policy: <span className="text-slate-300 font-mono">0-29 Allow | 85+ Block</span>
        </div>
      </div>
    </div>
  </header>
);
