import React from 'react';
import type { AuditEntry, DecisionType } from '../types';

interface Props {
  entry: AuditEntry | null;
  onClose: () => void;
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
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-slate-700/50">
    <span className="text-slate-500 text-xs uppercase tracking-wide font-medium w-36 shrink-0">{label}</span>
    <span className="text-slate-200 text-sm break-all">{value}</span>
  </div>
);

export const ActionDetailModal: React.FC<Props> = ({ entry, onClose }) => {
  if (!entry) return null;

  const ds = DECISION_STYLES[entry.decision];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 rounded-t-2xl border-b ${ds.bg} ${ds.border}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-bold ${ds.text}`}>{ds.label}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xl transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-slate-400 text-xs mt-1">{entry.reason}</p>
        </div>

        {/* Body */}
        <div className="p-5">
          <Row label="Action Type" value={
            <span className="font-mono text-blue-300">{entry.action_type}</span>
          } />
          <Row label="Target" value={
            <span className="font-mono text-amber-300">{entry.action_target}</span>
          } />
          {entry.action_description && (
            <Row label="Description" value={entry.action_description} />
          )}
          <Row label="Timestamp" value={
            new Date(entry.timestamp).toLocaleString()
          } />

          <h3 className="text-slate-400 text-xs uppercase tracking-wide font-medium mt-4 mb-1">Security Analysis</h3>

          <Row label="Intent Score" value={
            <span className={`font-bold text-base ${
              (entry.intent_score ?? 100) <= 20 ? 'text-red-400' :
              (entry.intent_score ?? 0) >= 60 ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {entry.intent_score !== null ? `${entry.intent_score}%` : '—'}
            </span>
          } />

          <Row label="Rule Triggered" value={
            entry.rule_matched ? (
              <span className="text-red-400 font-semibold">
                ⚠ {entry.rule_id} ({entry.rule_severity})
              </span>
            ) : (
              <span className="text-green-400">No rules matched</span>
            )
          } />

          <Row label="Risk Score" value={
            <span className={`font-bold text-base ${RISK_COLOR(entry.risk_score)}`}>
              {entry.risk_score !== null ? `${entry.risk_score} / 100` : '—'}
              {entry.risk_level && (
                <span className="text-xs ml-2 opacity-70">({entry.risk_level})</span>
              )}
            </span>
          } />

          <Row label="Decision" value={
            <span className={`font-bold ${ds.text}`}>{entry.decision}</span>
          } />

          {entry.execution_result && (
            <>
              <h3 className="text-slate-400 text-xs uppercase tracking-wide font-medium mt-4 mb-1">Execution</h3>
              <div className="bg-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap border border-slate-700">
                {entry.execution_result}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
