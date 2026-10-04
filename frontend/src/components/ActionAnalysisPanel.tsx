import React from 'react';
import type { AuditEntry, DecisionType, Task } from '../types';

interface Props {
  entry: AuditEntry | null;
  currentTask: Task | null;
  onInspectDetails?: (entry: AuditEntry) => void;
}

const DECISION_META: Record<
  DecisionType,
  { badge: string; text: string; label: string; symbol: string }
> = {
  ALLOW: {
    badge: 'bg-white text-black border border-white',
    text: 'text-white',
    label: '[ALLOW] ACTION PERMITTED',
    symbol: '[✓]',
  },
  SANDBOX: {
    badge: 'bg-zinc-900 text-zinc-200 border border-zinc-500',
    text: 'text-zinc-200',
    label: '[SANDBOX] ISOLATION MANDATED',
    symbol: '[⧖]',
  },
  APPROVAL_REQUIRED: {
    badge: 'bg-zinc-900 text-white border border-dashed border-zinc-400',
    text: 'text-zinc-200',
    label: '[APPROVAL] HUMAN CONFIRMATION REQD',
    symbol: '[!]',
  },
  BLOCK: {
    badge: 'bg-zinc-950 text-white border border-zinc-400 font-bold',
    text: 'text-white',
    label: '[BLOCK] EXECUTION TERMINATED',
    symbol: '[✕]',
  },
};

function renderAsciiMeter(score: number, totalBlocks = 20): string {
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * totalBlocks);
  const empty = totalBlocks - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export const ActionAnalysisPanel: React.FC<Props> = ({ entry, currentTask, onInspectDetails }) => {
  if (!entry) {
    return (
      <div className="bg-black border border-zinc-800 p-8 text-center flex flex-col items-center justify-center min-h-[360px] font-mono">
        <div className="w-12 h-12 border border-zinc-700 bg-zinc-950 flex items-center justify-center text-lg mb-3 text-zinc-300">
          ?
        </div>
        <h3 className="text-white font-bold text-sm uppercase">&gt; SELECT_ACTION_FROM_STREAM</h3>
        <p className="text-zinc-500 text-xs max-w-sm mt-1">
          Click any row in the security activity stream or run a threat simulation to inspect the intent authorization trace.
        </p>
      </div>
    );
  }

  const userIntent = entry.task_goal || currentTask?.goal || 'Fix authentication bug';
  const meta = DECISION_META[entry.decision] || DECISION_META.BLOCK;
  const isAllowed = entry.decision === 'ALLOW';
  const intentScore = entry.intent_score ?? 0;
  const riskScore = entry.risk_score ?? 0;

  return (
    <div className="bg-black border border-zinc-800 p-5 font-mono shadow-2xl space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
            &gt; ACTION_INSPECTION::LOG_ENTRY
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300 font-mono text-[11px]">{entry.action_type}</span>
        </div>
        <div className={`px-2.5 py-0.5 text-xs font-mono font-bold ${meta.badge}`}>
          {meta.symbol} {entry.decision}
        </div>
      </div>

      {/* User Intent vs Agent Proposed Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Intent Box */}
        <div className="bg-zinc-950 border border-zinc-800 p-3">
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
            $ BASELINE_USER_INTENT
          </div>
          <div className="text-white font-mono font-semibold">
            &quot;{userIntent}&quot;
          </div>
        </div>

        {/* Action Target Box */}
        <div className="bg-zinc-950 border border-zinc-800 p-3">
          <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
            $ PROPOSED_ACTION_TARGET
          </div>
          <div className="text-zinc-200 font-mono font-semibold break-all bg-black px-2 py-1 border border-zinc-800">
            {entry.action_target}
          </div>
          {entry.action_description && (
            <div className="text-[10px] text-zinc-500 mt-1 truncate">
              {entry.action_description}
            </div>
          )}
        </div>
      </div>

      {/* ASCII Progress Gauges: Intent Alignment & Risk Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Intent Alignment Meter */}
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-bold uppercase">INTENT_ALIGNMENT</span>
            <span className="text-white font-bold">{entry.intent_score !== null ? `${entry.intent_score}%` : 'N/A'}</span>
          </div>
          <div className="font-mono text-zinc-300 text-xs tracking-wider select-none">
            [{renderAsciiMeter(intentScore, 18)}]
          </div>
          <div className="text-[10px] text-zinc-500 pt-0.5">
            {entry.intent_reason || 'Cosine similarity with declared prompt intent.'}
          </div>
        </div>

        {/* Risk Score Meter */}
        <div className="bg-zinc-950 border border-zinc-800 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-bold uppercase">RISK_SCORE</span>
            <span className="text-white font-bold">{riskScore}/100</span>
          </div>
          <div className="font-mono text-zinc-300 text-xs tracking-wider select-none">
            [{renderAsciiMeter(riskScore, 18)}]
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
            <span>GATE: {riskScore >= 85 ? '&gt;=85 (BLOCK)' : riskScore >= 30 ? '30-84 (SANDBOX)' : '&lt;30 (ALLOW)'}</span>
            <span className="text-zinc-400 font-bold">{entry.risk_level || 'EVALUATED'}</span>
          </div>
        </div>
      </div>

      {/* Security Analysis / Reasons */}
      <div className="bg-zinc-950 border border-zinc-800 p-3 text-xs space-y-1.5">
        <div className="text-[10px] text-zinc-400 font-bold uppercase mb-1">
          $ POLICY_ENGINE_ANALYSIS
        </div>
        {isAllowed ? (
          <div className="text-zinc-300 space-y-1 text-[11px]">
            <div>[✓] Target resource is within declared workspace scope.</div>
            <div>[✓] No access to secrets, credentials, or environment keys.</div>
            <div>[✓] Action semantics correlate strongly with task goal.</div>
          </div>
        ) : (
          <div className="text-zinc-300 space-y-1 text-[11px]">
            {entry.rule_matched && (
              <div className="text-white font-semibold">
                [✕] TRIGGER: {entry.rule_id} ({entry.rule_severity}) &mdash; {entry.reason}
              </div>
            )}
            {intentScore < 40 && (
              <div>
                [✕] INTENT_MISMATCH: Cosine similarity {intentScore}% is below safety threshold.
              </div>
            )}
            {entry.risk_reasons?.map((r, i) => (
              <div key={i} className="text-zinc-400">
                [!] {r}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gateway Output */}
      {entry.execution_result && (
        <div className="bg-black border border-zinc-800 p-3">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center justify-between mb-1">
            <span>STDOUT::DISPATCH_RESULT</span>
            <span className={isAllowed ? 'text-zinc-300' : 'text-zinc-400'}>
              {isAllowed ? '[EXECUTION_SUCCESS]' : '[EXECUTION_ABORTED]'}
            </span>
          </div>
          <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
            &gt; {entry.execution_result}
          </pre>
        </div>
      )}

      {/* Footer With Full Proof Inspector Button */}
      <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[10px] text-zinc-500 font-mono">
          BLOCK #{entry.entry_index ?? 0} &bull; SHA-256 CHAINED
        </span>
        {onInspectDetails && (
          <button
            onClick={() => onInspectDetails(entry)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-white hover:text-black border border-zinc-700 hover:border-white text-zinc-200 text-xs font-mono font-bold transition-all cursor-pointer"
          >
            $ ./inspect-proof --deep
          </button>
        )}
      </div>
    </div>
  );
};
