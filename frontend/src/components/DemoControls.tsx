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
  const scenarios = [
    {
      id: 'Safe Demo',
      key: '1',
      cmd: './exploit --safe-patch',
      badge: 'ALLOW',
      desc: 'Edits auth code, runs pytest. 100% within intent boundary.',
      onClick: onRunSafe,
    },
    {
      id: 'Credential Theft Demo',
      key: '2',
      cmd: './exploit --steal-creds',
      badge: 'BLOCK',
      desc: 'Attempts ~/.aws/credentials read. Blocked by Tier-1 rule.',
      onClick: onRunCredentialTheft,
    },
    {
      id: 'Prompt Injection Demo',
      key: '3',
      cmd: './exploit --repo-inject',
      badge: 'BLOCK',
      desc: 'Poisoned PR comment tricks agent into exfiltration. Halted.',
      onClick: onRunPromptInjection,
    },
    {
      id: 'Slopsquatting Supply-Chain',
      key: '4',
      cmd: './exploit --slopsquat',
      badge: 'SANDBOX',
      desc: 'Typosquatted reqeusts package blocked before install trigger.',
      onClick: onRunSlopsquatting,
    },
    {
      id: 'Scope Creep & Blast Radius',
      key: '5',
      cmd: './exploit --blast-radius',
      badge: 'CRITICAL',
      desc: 'Escalation to rm -rf / blocked by blast-radius containment.',
      onClick: onRunScopeCreep,
    },
  ];

  return (
    <div className="bg-black border border-zinc-800 p-5 font-mono shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3 mb-4 text-xs">
        <div>
          <h2 className="text-white font-bold flex items-center gap-2">
            <span>&gt;</span> [TEST_SUITE::AUTONOMOUS_ATTACK_VECTORS]
          </h2>
          <p className="text-zinc-500 text-[11px] mt-0.5">
            Execute simulated agent attacks intercepted by MCP Proxy & Multi-Tier Intent Engine
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 text-white text-[11px]">
            <span className="animate-spin">[⧖]</span>
            <span>EXECUTING_PIPELINE...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {scenarios.map((s) => {
          const isActive = activeScenario === s.id;
          return (
            <button
              key={s.key}
              onClick={s.onClick}
              disabled={loading}
              className={`
                group relative p-3 text-left border font-mono transition-all flex flex-col justify-between
                ${
                  isActive
                    ? 'bg-white text-black border-white ring-2 ring-white/20'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900'
                }
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold ${isActive ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    [{s.key}] COMMAND
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold ${
                      isActive
                        ? 'bg-black text-white'
                        : 'bg-zinc-900 text-white border border-zinc-700'
                    }`}
                  >
                    {s.badge}
                  </span>
                </div>
                <div className={`font-mono text-xs font-bold mb-1.5 ${isActive ? 'text-black' : 'text-white'}`}>
                  $ {s.cmd}
                </div>
                <div
                  className={`text-[10px] leading-snug line-clamp-2 ${
                    isActive ? 'text-zinc-800' : 'text-zinc-400'
                  }`}
                >
                  {s.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
