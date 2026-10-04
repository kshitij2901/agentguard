import React from 'react';

interface Props {
  onRunSafe: () => void;
  onRunCredentialTheft: () => void;
  onRunPromptInjection: () => void;
  loading: boolean;
  activeScenario?: string | null;
}

export const DemoControls: React.FC<Props> = ({
  onRunSafe,
  onRunCredentialTheft,
  onRunPromptInjection,
  loading,
  activeScenario,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <span>🎬</span> Hackathon Demo Scenarios
          </h2>
          <p className="text-slate-400 text-xs">
            Trigger real simulated agent attacks evaluated through the AgentGuard security pipeline
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-400 text-xs shrink-0 font-medium">
            <div className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Executing Scenario Pipeline...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Scenario 1: Safe Coding */}
        <button
          onClick={onRunSafe}
          disabled={loading}
          className={`
            group relative p-4 rounded-xl text-left border transition-all duration-150
            ${activeScenario === 'Safe Demo' ? 'ring-2 ring-emerald-500 bg-emerald-950/30 border-emerald-600' : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-700/60'}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <span>▶</span> Safe Coding Demo
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              ALL ALLOWED
            </span>
          </div>
          <div className="text-xs text-slate-300 font-medium mb-1">
            Intent: "Fix authentication bug"
          </div>
          <div className="text-[11px] text-slate-400 leading-snug">
            Agent reads auth code, writes bugfix, and runs pytest. All actions stay strictly within user intent boundary.
          </div>
        </button>

        {/* Scenario 2: Credential Theft */}
        <button
          onClick={onRunCredentialTheft}
          disabled={loading}
          className={`
            group relative p-4 rounded-xl text-left border transition-all duration-150
            ${activeScenario === 'Credential Theft Demo' ? 'ring-2 ring-rose-500 bg-rose-950/30 border-rose-600' : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-rose-700/60'}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
              <span>▶</span> Credential Theft Demo
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
              BLOCKED
            </span>
          </div>
          <div className="text-xs text-slate-300 font-medium mb-1">
            Intent: "Fix authentication bug"
          </div>
          <div className="text-[11px] text-slate-400 leading-snug">
            Agent attempts to read <code className="text-rose-300 font-mono text-[10px]">~/.aws/credentials</code> and exfil. High intent mismatch + rule trigger $\rightarrow$ Instant Block.
          </div>
        </button>

        {/* Scenario 3: Prompt Injection */}
        <button
          onClick={onRunPromptInjection}
          disabled={loading}
          className={`
            group relative p-4 rounded-xl text-left border transition-all duration-150
            ${activeScenario === 'Prompt Injection Demo' ? 'ring-2 ring-amber-500 bg-amber-950/30 border-amber-600' : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-amber-700/60'}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
              <span>▶</span> Prompt Injection Demo
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
              INJECTION BLOCKED
            </span>
          </div>
          <div className="text-xs text-slate-300 font-medium mb-1">
            Intent: "Review PR and fix failing tests"
          </div>
          <div className="text-[11px] text-slate-400 leading-snug">
            Poisoned repository file instructs agent to exfiltrate SSH private keys. AgentGuard detects intent violation and blocks the payload.
          </div>
        </button>
      </div>
    </div>
  );
};
