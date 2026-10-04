import React from 'react';
import type { AuditEntry, DecisionType } from '../types';

interface Props {
  entries: AuditEntry[];
  selectedEntryId?: string | null;
  onSelect: (entry: AuditEntry) => void;
  loading: boolean;
}

const DECISION_STYLES: Record<DecisionType, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  SANDBOX: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  APPROVAL_REQUIRED: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  BLOCK: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
};

const DECISION_ICONS: Record<DecisionType, string> = {
  ALLOW: '✓ ALLOW',
  SANDBOX: '📦 SANDBOX',
  APPROVAL_REQUIRED: '⏳ APPROVAL',
  BLOCK: '🚫 BLOCK',
};

const ACTION_ICON: Record<string, string> = {
  FILE_READ: '📄',
  FILE_WRITE: '✏️',
  COMMAND_EXECUTE: '⚙️',
  NETWORK_REQUEST: '🌐',
  GIT_OPERATION: '🔀',
};

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return ts;
  }
}

function truncate(s: string | null, n: number): string {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export const ActivityFeed: React.FC<Props> = ({
  entries,
  selectedEntryId,
  onSelect,
  loading,
}) => (
  <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
    <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
      <div>
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <span>📡</span> Security Activity Feed
        </h3>
        <p className="text-slate-400 text-xs mt-0.5">
          Live stream of all agent actions evaluated against intent baseline
        </p>
      </div>
      <div className="flex items-center gap-2">
        {loading && (
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        )}
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-mono">
          {entries.length} events
        </span>
      </div>
    </div>

    {/* Table header */}
    <div className="grid grid-cols-12 px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
      <div className="col-span-2">Time / Type</div>
      <div className="col-span-4">Agent Action Target</div>
      <div className="col-span-3 text-center">Intent Alignment</div>
      <div className="col-span-1 text-center">Risk</div>
      <div className="col-span-2 text-right">Decision</div>
    </div>

    {/* Table Rows */}
    <div className="divide-y divide-slate-800/60 max-h-[420px] overflow-y-auto">
      {entries.length === 0 ? (
        <div className="px-5 py-16 text-center text-slate-500 text-sm">
          <span className="text-2xl block mb-2">🛡️</span>
          No actions evaluated yet. Click a demo scenario above to test the security pipeline.
        </div>
      ) : (
        entries.map((entry) => {
          const isSelected = entry.id === selectedEntryId;
          const intent = entry.intent_score ?? 0;
          const isMisaligned = intent < 40;
          const isAligned = intent >= 70;

          return (
            <div
              key={entry.id}
              onClick={() => onSelect(entry)}
              className={`
                grid grid-cols-12 px-5 py-3 items-center cursor-pointer transition-all duration-150 group
                ${isSelected ? 'bg-blue-950/40 border-l-4 border-l-blue-500 pl-4' : 'hover:bg-slate-800/50'}
              `}
            >
              {/* Time & Type */}
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-base" title={entry.action_type || ''}>
                  {ACTION_ICON[entry.action_type || ''] || '📄'}
                </span>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs font-mono">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {entry.action_type}
                  </span>
                </div>
              </div>

              {/* Target & Description */}
              <div className="col-span-4 pr-2">
                <div className="text-slate-200 text-xs font-mono font-medium group-hover:text-white transition-colors truncate">
                  {entry.action_target}
                </div>
                {entry.action_description && (
                  <div className="text-[11px] text-slate-400 truncate">
                    {entry.action_description}
                  </div>
                )}
              </div>

              {/* Intent Alignment with Mini Bar */}
              <div className="col-span-3 px-2 flex flex-col items-center justify-center">
                <div className="flex items-center justify-between w-full max-w-[140px] text-xs font-bold mb-1">
                  <span className={isAligned ? 'text-emerald-400' : isMisaligned ? 'text-rose-400' : 'text-amber-400'}>
                    {entry.intent_score !== null ? `${entry.intent_score}%` : '—'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {isAligned ? 'Aligned' : isMisaligned ? 'Mismatch' : 'Moderate'}
                  </span>
                </div>
                <div className="w-full max-w-[140px] bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isAligned
                        ? 'bg-emerald-400'
                        : isMisaligned
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.max(4, intent)}%` }}
                  />
                </div>
              </div>

              {/* Risk Score */}
              <div className="col-span-1 text-center">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    (entry.risk_score ?? 0) >= 85
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                      : (entry.risk_score ?? 0) >= 60
                      ? 'bg-orange-950/80 text-orange-400 border border-orange-800/80'
                      : (entry.risk_score ?? 0) >= 30
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                      : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                  }`}
                >
                  {entry.risk_score !== null ? entry.risk_score : '—'}
                </span>
              </div>

              {/* Decision Badge */}
              <div className="col-span-2 flex justify-end">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                    DECISION_STYLES[entry.decision]
                  }`}
                >
                  {DECISION_ICONS[entry.decision]}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);
