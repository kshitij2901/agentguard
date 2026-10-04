import React, { useState } from 'react';
import type { Task } from '../types';

interface Props {
  currentTask: Task | null;
  scenarioName?: string | null;
}

export const CurrentIntentPanel: React.FC<Props> = ({ currentTask, scenarioName }) => {
  const [expanded, setExpanded] = useState(false);

  const goal = currentTask?.goal || 'Fix authentication bug in login handler';
  const allowedPaths = currentTask?.allowed_paths?.length
    ? currentTask.allowed_paths
    : ['src/auth', 'tests/auth'];

  return (
    <div className="bg-black border border-zinc-800 p-3.5 font-mono shadow-md relative transition-all">
      {/* Compact HUD Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-500 font-bold uppercase text-[10px]">
            &gt; CONTEXT_HUD:
          </span>
          <span className="text-white font-bold font-mono">
            &quot;{goal}&quot;
          </span>
          {scenarioName && (
            <span className="px-1.5 py-0.2 text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-700">
              [{scenarioName}]
            </span>
          )}
          <span className="px-1.5 py-0.2 text-[9px] bg-white text-black font-bold">
            [STRICT_LOCKED]
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-zinc-500 hidden md:inline">
            ALLOWED: {allowedPaths.length} PATHS
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-0.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-500 text-[10px] font-bold font-mono transition-colors cursor-pointer"
          >
            {expanded ? '[-] HIDE SPEC' : '[+] EXPAND SPEC'}
          </button>
        </div>
      </div>

      {/* Collapsible Detail Drawer */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fade-in">
          {/* Allowed Scopes */}
          <div className="bg-zinc-950 border border-zinc-900 p-2.5">
            <div className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5 flex items-center justify-between">
              <span>[+] ALLOWED_WORKSPACE_PATHS</span>
              <span className="text-[9px] text-zinc-600">IN-BOUNDS</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allowedPaths.map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 bg-black text-white border border-zinc-700 text-[11px] font-mono"
                >
                  ./{p}/
                </span>
              ))}
            </div>
          </div>

          {/* Security Restrictions */}
          <div className="bg-zinc-950 border border-zinc-900 p-2.5">
            <div className="text-[10px] text-zinc-400 font-bold uppercase mb-1.5 flex items-center justify-between">
              <span>[-] HARD_INTERCEPT_BOUNDARIES</span>
              <span className="text-[9px] text-zinc-600">ZERO_TRUST</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="px-2 py-0.5 bg-black border border-zinc-800 text-zinc-300">
                [✕] SENSITIVE_CREDS
              </div>
              <div className="px-2 py-0.5 bg-black border border-zinc-800 text-zinc-300">
                [✕] OUTBOUND_EXFIL
              </div>
              <div className="px-2 py-0.5 bg-black border border-zinc-800 text-zinc-300">
                [✕] BLAST_DESTRUCTIVE
              </div>
              <div className="px-2 py-0.5 bg-black border border-zinc-800 text-zinc-300">
                [✕] REMOTE_GIT_PUSH
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
