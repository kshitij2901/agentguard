import React from 'react';
import type { Task } from '../types';

interface Props {
  currentTask: Task | null;
  scenarioName?: string | null;
}

export const CurrentIntentPanel: React.FC<Props> = ({ currentTask, scenarioName }) => {
  const goal = currentTask?.goal || 'Fix authentication bug in login handler';
  const allowedPaths = currentTask?.allowed_paths?.length
    ? currentTask.allowed_paths
    : ['src/auth', 'tests/auth'];

  return (
    <div className="bg-black border border-zinc-800 p-5 font-mono shadow-xl relative">
      {/* Terminal Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
            &gt; CURRENT_SECURITY_CONTEXT::INTENT_BASELINE
          </span>
          {scenarioName && (
            <span className="px-1.5 py-0.5 text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-700">
              [{scenarioName}]
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span>GATEWAY_MODE:</span>
          <span className="font-bold text-white bg-zinc-900 border border-zinc-700 px-2 py-0.5">
            [STRICT_INTENT_LOCKED]
          </span>
        </div>
      </div>

      {/* Main Intent Banner */}
      <div className="bg-zinc-950 border border-zinc-800 p-3.5 mb-4">
        <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">
          $ USER_DECLARED_TASK_GOAL
        </div>
        <div className="text-white text-sm sm:text-base font-bold font-mono">
          &gt; &quot;{goal}&quot;
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Allowed Scopes */}
        <div className="bg-zinc-950 border border-zinc-900 p-3">
          <div className="text-[10px] text-zinc-400 font-bold uppercase mb-2 flex items-center justify-between">
            <span>[+] ALLOWED_WORKSPACE_PATHS</span>
            <span className="text-[9px] text-zinc-600">IN-BOUNDS</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowedPaths.map((p) => (
              <span
                key={p}
                className="px-2 py-1 bg-black text-white border border-zinc-700 text-xs font-mono"
              >
                ./{p}/
              </span>
            ))}
          </div>
        </div>

        {/* Security Restrictions */}
        <div className="bg-zinc-950 border border-zinc-900 p-3">
          <div className="text-[10px] text-zinc-400 font-bold uppercase mb-2 flex items-center justify-between">
            <span>[-] HARD_INTERCEPT_BOUNDARIES</span>
            <span className="text-[9px] text-zinc-600">ZERO_TRUST</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="px-2 py-1 bg-black border border-zinc-800 text-zinc-300">
              [✕] SENSITIVE_CREDS
            </div>
            <div className="px-2 py-1 bg-black border border-zinc-800 text-zinc-300">
              [✕] OUTBOUND_EXFIL
            </div>
            <div className="px-2 py-1 bg-black border border-zinc-800 text-zinc-300">
              [✕] BLAST_DESTRUCTIVE
            </div>
            <div className="px-2 py-1 bg-black border border-zinc-800 text-zinc-300">
              [✕] REMOTE_GIT_PUSH
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
