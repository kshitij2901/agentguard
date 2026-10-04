import React, { useState } from 'react';

interface Props {
  onExecuteCommand: (cmd: string) => void;
  disabled?: boolean;
}

const QUICK_COMMANDS = [
  { label: 'run safe', cmd: 'run safe', desc: 'Safe bug patch' },
  { label: 'run theft', cmd: 'run theft', desc: 'Credential exfil attack' },
  { label: 'run injection', cmd: 'run injection', desc: 'Prompt injection PR' },
  { label: 'run slop', cmd: 'run slop', desc: 'Typosquatting supply chain' },
  { label: 'run blast', cmd: 'run blast', desc: 'rm -rf blast radius' },
  { label: 'verify chain', cmd: 'verify chain', desc: 'Verify SHA-256 Merkle root' },
];

export const CommandLineBar: React.FC<Props> = ({ onExecuteCommand, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onExecuteCommand(input.trim());
    setInput('');
  };

  const handleQuickClick = (cmd: string) => {
    if (disabled) return;
    onExecuteCommand(cmd);
  };

  return (
    <div className="bg-black border border-zinc-800 p-2.5 font-mono shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold pl-2 select-none shrink-0">
          <span className="text-white">root@agentguard</span>
          <span className="text-zinc-600">:</span>
          <span className="text-zinc-300">~</span>
          <span className="text-white font-bold">&gt;</span>
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type command (e.g. 'run theft', 'run safe', 'verify chain', 'help') or click below..."
          disabled={disabled}
          className="bg-transparent border-0 outline-none text-white text-xs font-mono w-full placeholder-zinc-600 focus:ring-0 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-3 py-1 bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white text-black text-xs font-bold font-mono transition-colors cursor-pointer shrink-0"
        >
          $ EXEC
        </button>
      </form>

      {/* Quick Interactive Command Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-zinc-900 text-[11px]">
        <span className="text-zinc-600 text-[10px] uppercase font-bold select-none mr-1">
          QUICK EXEC:
        </span>
        {QUICK_COMMANDS.map((q) => (
          <button
            key={q.cmd}
            type="button"
            onClick={() => handleQuickClick(q.cmd)}
            disabled={disabled}
            className="px-2 py-0.5 bg-zinc-950 hover:bg-white hover:text-black border border-zinc-800 hover:border-white text-zinc-300 text-[11px] font-mono transition-all cursor-pointer disabled:opacity-40"
            title={q.desc}
          >
            $ {q.label}
          </button>
        ))}
      </div>
    </div>
  );
};
