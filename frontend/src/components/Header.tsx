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

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/50">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">
            MCP GATEWAY ACTIVE
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-700/50">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-purple-300 text-xs font-mono font-medium">
            Web3 SHA-256 Ledger
          </span>
        </div>

        <a
          href="https://github.com/kshitij2901/agentguard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          GitHub
        </a>
      </div>
    </div>
  </header>
);
