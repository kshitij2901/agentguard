import React from 'react';
import type { Task } from '../types';

interface Props {
  currentTask: Task | null;
  scenarioName?: string | null;
}

export const CurrentIntentPanel: React.FC<Props> = ({ currentTask, scenarioName }) => {
  const goal = currentTask?.goal || "Fix authentication bug";
  const allowedPaths = currentTask?.allowed_paths?.length
    ? currentTask.allowed_paths
    : ["src/auth", "tests/auth"];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/80 p-5 shadow-xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -right-20 -top-20 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
              Current Security Context
            </span>
            {scenarioName && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/80 border border-blue-700/50 text-blue-300">
                {scenarioName}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1 tracking-tight flex items-center gap-2">
            <span className="text-slate-400 font-normal">Intent:</span> "{goal}"
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Authorization Mode:</span>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <span>🛡️</span> Intent-Bound
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allowed Scope */}
        <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span>✓</span> Allowed Scope
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Paths permitted for this task</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allowedPaths.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-700/40 text-emerald-300 font-mono text-xs flex items-center gap-1.5"
              >
                <span className="text-emerald-400 font-bold">✓</span> {p}
              </span>
            ))}
          </div>
        </div>

        {/* Security Restrictions */}
        <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span>✕</span> Default Restrictions
            </span>
            <span className="text-[10px] text-slate-500 font-normal">Intercepted if attempted</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5" title="AWS, SSH, .env, private keys">
              <span className="text-rose-400 font-bold text-xs">✕</span> Credentials
            </div>
            <div className="px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5" title="External HTTP/Socket calls">
              <span className="text-rose-400 font-bold text-xs">✕</span> Net Exfil
            </div>
            <div className="px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5" title="rm -rf, DROP TABLE, sudo">
              <span className="text-rose-400 font-bold text-xs">✕</span> Destructive
            </div>
            <div className="px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5" title="git push to remote repository">
              <span className="text-rose-400 font-bold text-xs">✕</span> Git Push
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
