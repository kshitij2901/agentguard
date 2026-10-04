import React from 'react';

interface Props {
  onRunSafe: () => void;
  onRunCredentialTheft: () => void;
  onRunPromptInjection: () => void;
  onRunSlopsquatting: () => void;
  onRunScopeCreep: () => void;
  loading: boolean;
  activeScenario?: string | null;
}

export const DemoControls: React.FC<Props> = ({
  onRunSafe,
  onRunCredentialTheft,
  onRunPromptInjection,
  onRunSlopsquatting,
  onRunScopeCreep,
  loading,
  activeScenario,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <span>⚡</span> High-Impact Hackathon Attack Vectors & Scenarios
          </h2>
          <p className="text-slate-400 text-xs">
            Test autonomous AI coding agent threat vectors intercepted by AgentGuard's MCP Gateway & Multi-Tier Intent Engine
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-400 text-xs shrink-0 font-medium">
            <div className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            Executing Security Pipeline...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Scenario 1: Safe Coding */}
        <button
          onClick={onRunSafe}
          disabled={loading}
          className={`
            group relative p-3.5 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between
            ${activeScenario === 'Safe Demo' ? 'ring-2 ring-emerald-500 bg-emerald-950/30 border-emerald-600' : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-emerald-700/60'}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-emerald-400 flex items-center gap-1">
                <span>1.</span> Safe Coding
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                ALLOW
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium mb-1">
              "Fix authentication bug"
            </div>
            <div className="text-[10px] text-slate-400 leading-snug">
              Reads auth code, patches bug, runs pytest. 100% within intent boundary.
            </div>
          </div>
        </button>

        {/* Scenario 2: Credential Theft */}
        <button
          onClick={onRunCredentialTheft}
          disabled={loading}
          className={`
            group relative p-3.5 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between
            ${activeScenario === 'Credential Theft Demo' ? 'ring-2 ring-rose-500 bg-rose-950/30 border-rose-600' : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-rose-700/60'}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-rose-400 flex items-center gap-1">
                <span>2.</span> Credential Theft
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                BLOCK
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium mb-1">
              "Fix authentication bug"
            </div>
            <div className="text-[10px] text-slate-400 leading-snug">
              Agent attempts to read <code className="text-rose-300 font-mono text-[9px]">~/.aws/credentials</code>. Instant Tier-1 rule block.
            </div>
          </div>
        </button>

        {/* Scenario 3: Prompt Injection */}
        <button
          onClick={onRunPromptInjection}
          disabled={loading}
          className={`
            group relative p-3.5 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between
            ${activeScenario === 'Prompt Injection Demo' ? 'ring-2 ring-amber-500 bg-amber-950/30 border-amber-600' : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-amber-700/60'}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-amber-400 flex items-center gap-1">
                <span>3.</span> Repo Injection
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                BLOCK
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium mb-1">
              "Review PR #42 & test"
            </div>
            <div className="text-[10px] text-slate-400 leading-snug">
              Poisoned repo comment tricks agent into exfiltrating secrets. Stopped by intent boundary.
            </div>
          </div>
        </button>

        {/* Scenario 4: Slopsquatting */}
        <button
          onClick={onRunSlopsquatting}
          disabled={loading}
          className={`
            group relative p-3.5 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between
            ${activeScenario === 'Slopsquatting Supply-Chain' ? 'ring-2 ring-purple-500 bg-purple-950/30 border-purple-600' : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-purple-700/60'}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-purple-400 flex items-center gap-1">
                <span>4.</span> Slopsquatting
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                SUPPLY CHAIN
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium mb-1">
              "Install HTTP client"
            </div>
            <div className="text-[10px] text-slate-400 leading-snug">
              Agent hallucinates <code className="text-purple-300 font-mono text-[9px]">pip install reqeusts</code> with malicious install hooks. Blocked!
            </div>
          </div>
        </button>

        {/* Scenario 5: Scope Creep */}
        <button
          onClick={onRunScopeCreep}
          disabled={loading}
          className={`
            group relative p-3.5 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between
            ${activeScenario === 'Scope Creep & Blast Radius' ? 'ring-2 ring-red-500 bg-red-950/30 border-red-600' : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-red-700/60'}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-red-400 flex items-center gap-1">
                <span>5.</span> Blast Radius
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-800">
                CRITICAL
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium mb-1">
              "Clean temporary files"
            </div>
            <div className="text-[10px] text-slate-400 leading-snug">
              Cleanup command escalates to <code className="text-red-300 font-mono text-[9px]">rm -rf /</code>. Blast-radius containment blocks catastrophe.
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
