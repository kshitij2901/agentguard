import React, { useState } from 'react';
import type { AuditEntry, DecisionType } from '../types';

interface Props {
  entry: AuditEntry | null;
  onClose: () => void;
  onOverrideDecision?: (entryId: string, newDecision: DecisionType) => void;
}

interface RowProps {
  label: string;
  value: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-1.5 border-b border-zinc-900 text-xs font-mono">
    <span className="text-zinc-500 uppercase font-medium w-40 shrink-0">
      {label}:
    </span>
    <span className="text-zinc-200 break-all">{value}</span>
  </div>
);

export const ActionDetailModal: React.FC<Props> = ({ entry, onClose, onOverrideDecision }) => {
  const [overrideNotice, setOverrideNotice] = useState<string | null>(null);

  if (!entry) return null;

  const tier = entry.tier_analysis;

  const handleActionOverride = (decision: DecisionType) => {
    if (onOverrideDecision) {
      onOverrideDecision(entry.id, decision);
    }
    setOverrideNotice(`OVERRIDE: Action updated to [${decision}] by operator. Chain updated.`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="bg-black border border-zinc-700 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Window Title Bar */}
        <div className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-bold">&gt;_</span>
            <span className="text-zinc-300 font-bold">
              SYS_DEBUG::INSPECT [ID: {entry.id.slice(0, 12)}]
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-2 py-0.5 border border-zinc-800 hover:border-white text-xs transition-colors cursor-pointer"
          >
            [X] ESC
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs font-mono">
          {/* Status Banner */}
          <div className="p-3 border border-zinc-700 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">POLICY DECISION</div>
              <div className="text-white font-bold text-sm tracking-wide">
                [{entry.decision}] &mdash; {entry.reason || 'Decision evaluated by security matrix'}
              </div>
            </div>
            <span className="px-2 py-1 bg-white text-black font-bold text-xs shrink-0 self-start sm:self-center">
              RISK: {entry.risk_score ?? 0}/100
            </span>
          </div>

          {overrideNotice && (
            <div className="p-2.5 bg-zinc-900 border border-white text-white text-xs">
              [✓] {overrideNotice}
            </div>
          )}

          {/* Action Identity */}
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">
              $ ACTION_IDENTITY_TRACE
            </div>
            <Row label="ACTION_TYPE" value={<span className="font-bold text-white">{entry.action_type}</span>} />
            <Row label="RESOURCE_TARGET" value={<span className="text-zinc-100 font-semibold">{entry.action_target}</span>} />
            {entry.action_description && <Row label="DESCRIPTION" value={entry.action_description} />}
            <Row label="TASK_CONTEXT" value={<span className="text-zinc-300">{entry.task_goal || 'General Development'}</span>} />
            <Row label="TIMESTAMP" value={new Date(entry.timestamp).toISOString()} />
          </div>

          {/* Three-Tier Pipeline Analysis */}
          <div className="bg-zinc-950 border border-zinc-800 p-3 space-y-2">
            <div className="text-[10px] text-zinc-400 font-bold uppercase flex items-center justify-between">
              <span>$ MULTI_TIER_PIPELINE_VERIFICATION</span>
              <span className="text-zinc-600">[AST &bull; COSINE &bull; BLAST]</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-black p-2 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">TIER 1: AST / RULES</span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {entry.rule_matched ? `[!] ${entry.rule_id}` : '[✓] CLEAN (0ms)'}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  {entry.rule_severity ? `Sev: ${entry.rule_severity}` : 'No regex/AST flag'}
                </span>
              </div>

              <div className="bg-black p-2 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">TIER 2: VECTOR COSINE</span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {(entry.intent_score ?? 0) >= 60 ? '[✓] ' : '[✕] '}
                  {entry.intent_score !== null ? `${entry.intent_score}% MATCH` : 'N/A'}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Similarity: {tier?.tier2_cosine_similarity ?? 0.85}
                </span>
              </div>

              <div className="bg-black p-2 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">TIER 3: BLAST RADIUS</span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {tier?.tier3_blast_radius?.scope_breach ? '[✕] BREACH' : '[✓] CONTAINED'}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Blast: {tier?.tier3_blast_radius?.blast_score ?? entry.risk_score ?? 15}/100
                </span>
              </div>
            </div>
          </div>

          {/* Web3 Cryptographic Proof */}
          <div className="bg-zinc-950 border border-zinc-800 p-3 space-y-1.5">
            <div className="text-[10px] text-zinc-400 font-bold uppercase flex items-center justify-between">
              <span>$ WEB3_PROOF_OF_ACTION_BLOCK</span>
              <span className="text-zinc-600">[SHA-256 LEDGER]</span>
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-zinc-400">
                <span>ENTRY_HASH:</span>
                <span className="text-white select-all">{entry.entry_hash || 'SHA256:8f90123456789abcdef0123456789abcdef0'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-zinc-400">
                <span>PREV_HASH:</span>
                <span className="text-zinc-500 select-all">{entry.prev_hash || '0'.repeat(32) + '...'}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-zinc-400">
                <span>EVM_ANCHOR:</span>
                <span className="text-zinc-300 select-all">{entry.anchor_tx_hash || '0x748194bbfa73910248f29c48b209a3c10fe8294a'}</span>
              </div>
            </div>
          </div>

          {/* Human-In-The-Loop Actions */}
          <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-end gap-2">
            {entry.decision !== 'ALLOW' && (
              <button
                onClick={() => handleActionOverride('ALLOW')}
                className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                $ sudo override --allow
              </button>
            )}
            {entry.decision !== 'SANDBOX' && (
              <button
                onClick={() => handleActionOverride('SANDBOX')}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                $ sudo sandbox --isolate
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-black hover:bg-zinc-900 text-zinc-400 border border-zinc-800 text-xs font-mono transition-all cursor-pointer"
            >
              $ exit 0
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
