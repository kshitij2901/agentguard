import React from 'react';

export const Header: React.FC = () => (
  <header className="bg-black/95 border-b border-zinc-800 sticky top-0 z-40 backdrop-blur-md font-mono">
    {/* Terminal Window Header Bar */}
    <div className="border-b border-zinc-900 px-4 py-1.5 flex items-center justify-between text-[11px] text-zinc-500 bg-zinc-950/80 select-none">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors inline-block" />
        </div>
        <span className="text-zinc-400 font-mono text-[10px] ml-2">
          agentguard-mcp-gateway // dev_session_01 [80x24]
        </span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
        <span className="hidden sm:inline">TTY: /dev/pts/0</span>
        <span className="text-zinc-400">HOST: 127.0.0.1:8000</span>
        <span className="px-1.5 py-0.2 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded text-[9px] uppercase font-bold">
          B&W TERMINAL
        </span>
      </div>
    </div>

    {/* Main Terminal Header Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 border border-zinc-700 bg-zinc-950 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          &gt;_
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white font-extrabold text-lg tracking-tight font-mono flex items-center">
              AGENTGUARD<span className="text-zinc-500 mx-1">::</span>PROXY
              <span className="terminal-cursor" />
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-black border border-white">
              MCP-ACTIVE
            </span>
          </div>
          <p className="text-zinc-400 text-xs font-mono mt-0.5">
            Deterministic Rule-Graph Engine &bull; Cosine Intent Verification &bull; Web3 Ledger
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-white animate-term-pulse" />
          <span className="text-zinc-300 text-[11px] font-mono">MCP: SECURE_GATEWAY</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
          <span className="text-white">⛓</span>
          <span className="text-[11px] font-mono text-zinc-300">SHA-256_LEDGER</span>
        </div>

        <a
          href="https://github.com/kshitij2901/agentguard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-white hover:text-black border border-zinc-700 hover:border-white text-zinc-200 text-xs font-mono transition-all"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          $ git repo
        </a>
      </div>
    </div>
  </header>
);
