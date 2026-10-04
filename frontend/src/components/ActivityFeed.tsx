import React from 'react';
import type { AuditEntry, DecisionType } from '../types';

interface Props {
  entries: AuditEntry[];
  selectedEntryId?: string | null;
  onSelect: (entry: AuditEntry) => void;
  loading: boolean;
}

const DECISION_BADGES: Record<DecisionType, { text: string; bg: string }> = {
  ALLOW: { text: '[✓ ALLOW]', bg: 'bg-white text-black font-bold' },
  SANDBOX: { text: '[⧖ SANDBOX]', bg: 'bg-zinc-800 text-zinc-200 border border-zinc-600' },
  APPROVAL_REQUIRED: { text: '[! REVIEW]', bg: 'bg-zinc-900 text-white border border-dashed border-zinc-400' },
  BLOCK: { text: '[✕ BLOCK]', bg: 'bg-black text-white border border-zinc-400 font-bold' },
};

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return ts;
  }
}

function miniAsciiBar(score: number): string {
  const bars = Math.round((Math.max(0, Math.min(100, score)) / 100) * 8);
  return '█'.repeat(bars) + '░'.repeat(8 - bars);
}

export const ActivityFeed: React.FC<Props> = ({
  entries,
  selectedEntryId,
  onSelect,
  loading,
}) => (
  <div className="bg-black border border-zinc-800 font-mono shadow-xl overflow-hidden">
    {/* Terminal Header */}
    <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between text-xs bg-zinc-950/80">
      <div>
        <h3 className="text-white font-bold flex items-center gap-2">
          <span>&gt;</span> [AUDIT_STREAM::SYS_LOG]
        </h3>
        <p className="text-zinc-500 text-[10px] mt-0.5">
          Real-time intercept log &bull; evaluated against intent baseline
        </p>
      </div>
      <div className="flex items-center gap-2">
        {loading && (
          <span className="text-zinc-400 text-[10px] animate-pulse">
            STREAMING...
          </span>
        )}
        <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">
          {entries.length} EVENTS
        </span>
      </div>
    </div>

    {/* Table Header */}
    <div className="grid grid-cols-12 px-4 py-2 border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-wider font-bold bg-black">
      <div className="col-span-2">TIME / TYPE</div>
      <div className="col-span-4">TARGET RESOURCE</div>
      <div className="col-span-3 text-center">INTENT ALIGN</div>
      <div className="col-span-1 text-center">RISK</div>
      <div className="col-span-2 text-right">DECISION</div>
    </div>

    {/* Table Rows */}
    <div className="divide-y divide-zinc-900 max-h-[420px] overflow-y-auto">
      {entries.length === 0 ? (
        <div className="px-4 py-12 text-center text-zinc-500 text-xs">
          [!] No events recorded. Run a test vector above to populate stream.
        </div>
      ) : (
        entries.map((entry) => {
          const isSelected = entry.id === selectedEntryId;
          const badge = DECISION_BADGES[entry.decision] || DECISION_BADGES.BLOCK;
          const intent = entry.intent_score ?? 0;

          return (
            <div
              key={entry.id}
              onClick={() => onSelect(entry)}
              className={`
                grid grid-cols-12 px-4 py-2.5 items-center cursor-pointer transition-colors text-xs
                ${
                  isSelected
                    ? 'bg-zinc-900 border-l-2 border-white pl-3.5 text-white'
                    : 'hover:bg-zinc-950 text-zinc-300'
                }
              `}
            >
              {/* Time & Type */}
              <div className="col-span-2 flex flex-col font-mono">
                <span className="text-zinc-300 text-[11px]">
                  {formatTime(entry.timestamp)}
                </span>
                <span className="text-zinc-600 text-[9px] uppercase">
                  {(entry.action_type || 'ACTION').replace('_', ' ')}
                </span>
              </div>

              {/* Target */}
              <div className="col-span-4 pr-2 font-mono">
                <div className="font-semibold truncate text-[11px] text-zinc-200">
                  {entry.action_target}
                </div>
                {entry.action_description && (
                  <div className="text-[10px] text-zinc-500 truncate">
                    {entry.action_description}
                  </div>
                )}
              </div>

              {/* Intent Alignment */}
              <div className="col-span-3 px-1 flex flex-col items-center justify-center font-mono">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-zinc-400 select-none">[{miniAsciiBar(intent)}]</span>
                  <span className="font-bold text-white">
                    {entry.intent_score !== null ? `${entry.intent_score}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Risk Score */}
              <div className="col-span-1 text-center font-mono">
                <span className="text-[11px] font-bold text-zinc-200">
                  {entry.risk_score !== null ? entry.risk_score : '—'}
                </span>
              </div>

              {/* Decision Badge */}
              <div className="col-span-2 flex justify-end font-mono">
                <span className={`px-2 py-0.5 text-[10px] ${badge.bg}`}>
                  {badge.text}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);
