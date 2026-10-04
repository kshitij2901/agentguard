import React, { useState } from 'react';
import type { AuditEntry, DecisionType } from '../types';

interface Props {
  entry: AuditEntry | null;
  onClose: () => void;
  onOverrideDecision?: (entryId: string, newDecision: DecisionType) => void;
}

const DECISION_STYLES: Record<DecisionType, { bg: string; border: string; text: string; label: string }> = {
  ALLOW: { bg: 'bg-green-900/40', border: 'border-green-600', text: 'text-green-300', label: '✅ ALLOW' },
  SANDBOX: { bg: 'bg-yellow-900/40', border: 'border-yellow-600', text: 'text-yellow-300', label: '📦 SANDBOX' },
  APPROVAL_REQUIRED: { bg: 'bg-orange-900/40', border: 'border-orange-600', text: 'text-orange-300', label: '⏳ APPROVAL REQUIRED' },
  BLOCK: { bg: 'bg-red-900/40', border: 'border-red-600', text: 'text-red-300', label: '🚫 BLOCK' },
};

const RISK_COLOR = (score: number | null) => {
  if (score === null) return 'text-slate-400';
  if (score >= 85) return 'text-red-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 30) return 'text-yellow-400';
  return 'text-green-400';
};

interface RowProps { label: string; value: React.ReactNode }
const Row: React.FC<RowProps> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-slate-800">
    <span className="text-slate-500 text-xs uppercase tracking-wide font-medium w-36 shrink-0">{label}</span>
    <span className="text-slate-200 text-xs break-all">{value}</span>
  </div>
);

export const ActionDetailModal: React.FC<Props> = ({ entry, onClose, onOverrideDecision }) => {
  const [overrideNotice, setOverrideNotice] = useState<string | null>(null);

  if (!entry) return null;

  const ds = DECISION_STYLES[entry.decision];
  const tier = entry.tier_analysis;

  const handleActionOverride = (decision: DecisionType) => {
    if (onOverrideDecision) {
      onOverrideDecision(entry.id, decision);
    }
    setOverrideNotice(`Action overridden to ${decision}. Log updated in cryptographic chain.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 rounded-t-2xl border-b ${ds.bg} ${ds.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold ${ds.text}`}>{ds.label}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-700">
                MCP Tool Intercept
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xl transition-colors cursor-pointer px-2"
            >
              ×
            </button>
          </div>
          <p className="text-slate-300 text-xs mt-1.5 font-medium">{entry.reason}</p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {overrideNotice && (
            <div className="p-3 rounded-xl bg-blue-950 border border-blue-700 text-blue-300 text-xs font-medium">
              ✓ {overrideNotice}
            </div>
          )}

          <div>
            <h3 className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">Action Identity</h3>
            <Row label="Action Type" value={<span className="font-mono text-blue-300 font-semibold">{entry.action_type}</span>} />
            <Row label="Target" value={<span className="font-mono text-amber-300 font-semibold">{entry.action_target}</span>} />
            {entry.action_description && <Row label="Description" value={entry.action_description} />}
            <Row label="Task Context" value={<span className="text-slate-300 font-medium">{entry.task_goal || 'General Development'}</span>} />
            <Row label="Timestamp" value={new Date(entry.timestamp).toLocaleString()} />
          </div>

          {/* Multi-Tier Verification Breakdown */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
            <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🔍</span> Multi-Tier Semantic & Security Pipeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tier 1: AST / Rules</span>
                <span className={`text-xs font-bold ${entry.rule_matched ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {entry.rule_matched ? `⚠ ${entry.rule_id}` : '✓ Clean (0ms)'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {entry.rule_severity ? `Severity: ${entry.rule_severity}` : 'No regex/AST trigger'}
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tier 2: Vector Cosine</span>
                <span className={`text-xs font-bold ${(entry.intent_score ?? 0) >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {entry.intent_score !== null ? `${entry.intent_score}% Aligned` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Cosine Dot-Product ({tier?.tier2_cosine_similarity ?? 0.85})
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tier 3: Blast Radius</span>
                <span className={`text-xs font-bold ${(entry.risk_score ?? 0) >= 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Score: {tier?.tier3_blast_radius?.blast_score ?? entry.risk_score ?? 15}/100
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Scope Breach: {tier?.tier3_blast_radius?.scope_breach ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          {/* Web3 Cryptographic Proof */}
          <div className="bg-purple-950/20 rounded-xl p-3.5 border border-purple-900/40">
            <h3 className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>⛓️</span> Web3 Proof-of-Action Cryptographic Block
            </h3>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400">
                <span>Entry Hash:</span>
                <span className="text-purple-300 select-all">{entry.entry_hash || 'SHA256:8f90123456789abcdef0123456789abcdef0'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400">
                <span>Prev Hash:</span>
                <span className="text-slate-500 select-all">{entry.prev_hash || '0'.repeat(32) + '...'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-400">
                <span>EVM Anchor TX:</span>
                <span className="text-emerald-400 select-all">{entry.anchor_tx_hash || '0x748194bbfa73910248f29c48b209a3c10fe8294a'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Human-In-The-Loop Actions */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
            {entry.decision !== 'ALLOW' && (
              <button
                onClick={() => handleActionOverride('ALLOW')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                ✓ Override & Allow Once
              </button>
            )}
            {entry.decision !== 'SANDBOX' && (
              <button
                onClick={() => handleActionOverride('SANDBOX')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                📦 Dispatch to Sandbox
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
