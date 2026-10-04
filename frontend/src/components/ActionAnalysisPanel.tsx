import React from 'react';
import type { AuditEntry, DecisionType, Task } from '../types';

interface Props {
  entry: AuditEntry | null;
  currentTask: Task | null;
  onInspectDetails?: (entry: AuditEntry) => void;
}

const DECISION_META: Record<DecisionType, { badge: string; border: string; bg: string; text: string; icon: string; title: string }> = {
  ALLOW: {
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-950/20',
    text: 'text-emerald-400',
    icon: '✓',
    title: 'ACTION PERMITTED',
  },
  SANDBOX: {
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    border: 'border-amber-500/50',
    bg: 'bg-amber-950/20',
    text: 'text-amber-400',
    icon: '📦',
    title: 'SANDBOX ISOLATION REQUIRED',
  },
  APPROVAL_REQUIRED: {
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    border: 'border-orange-500/50',
    bg: 'bg-orange-950/20',
    text: 'text-orange-400',
    icon: '⏳',
    title: 'HUMAN APPROVAL REQUIRED',
  },
  BLOCK: {
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    border: 'border-rose-500/50',
    bg: 'bg-rose-950/20',
    text: 'text-rose-400',
    icon: '🚫',
    title: 'ACTION BLOCKED BY AGENTGUARD',
  },
};

function getIntentLabel(score: number | null): { label: string; color: string; desc: string } {
  if (score === null) return { label: 'Unknown', color: 'text-slate-400', desc: 'No score available' };
  if (score >= 90) return { label: 'Strongly aligned', color: 'text-emerald-400', desc: 'Action directly accomplishes the user intent' };
  if (score >= 70) return { label: 'Aligned', color: 'text-emerald-300', desc: 'Action is consistent with task context' };
  if (score >= 40) return { label: 'Weakly aligned', color: 'text-amber-400', desc: 'Action is marginally related to user goal' };
  return { label: 'Misaligned', color: 'text-rose-400', desc: 'Action deviates significantly from original user intent' };
}

function getRiskColor(score: number | null): string {
  if (score === null) return 'text-slate-400';
  if (score >= 85) return 'text-rose-400';
  if (score >= 60) return 'text-orange-400';
  if (score >= 30) return 'text-amber-400';
  return 'text-emerald-400';
}

export const ActionAnalysisPanel: React.FC<Props> = ({ entry, currentTask, onInspectDetails }) => {
  if (!entry) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-2xl mb-3 text-slate-400">
          🔍
        </div>
        <h3 className="text-white font-bold text-base">Select an Action to Inspect</h3>
        <p className="text-slate-400 text-xs max-w-sm mt-1">
          Click any row in the activity log or run a demo scenario to see the complete Intent-Bound Authorization breakdown.
        </p>
      </div>
    );
  }

  const userIntent = entry.task_goal || currentTask?.goal || "Fix authentication bug";
  const intentMeta = getIntentLabel(entry.intent_score);
  const decisionMeta = DECISION_META[entry.decision] || DECISION_META.BLOCK;
  const isAllowed = entry.decision === 'ALLOW';
  const isBlocked = entry.decision === 'BLOCK';

  return (
    <div className={`bg-slate-900 rounded-2xl border ${decisionMeta.border} p-5 shadow-2xl transition-all duration-200 relative overflow-hidden`}>
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Action Security Analysis
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 text-xs font-mono">{entry.action_type}</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${decisionMeta.badge}`}>
          <span>{decisionMeta.icon}</span>
          <span>{entry.decision}</span>
        </div>
      </div>

      {/* Hero: User Intent vs Agent Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {/* User Intent Box */}
        <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800">
          <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>👤</span> User Intent
          </div>
          <div className="text-white font-semibold text-sm">
            "{userIntent}"
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Original security baseline set by the user
          </div>
        </div>

        {/* Agent Action Box */}
        <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>🤖</span> Agent Proposed Action
          </div>
          <div className="text-slate-100 font-mono text-xs font-medium break-all bg-slate-900 px-2 py-1 rounded border border-slate-700/50">
            {entry.action_target}
          </div>
          {entry.action_description && (
            <div className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
              {entry.action_description}
            </div>
          )}
        </div>
      </div>

      {/* Hero Metrics: Intent Alignment vs Risk Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Intent Alignment Hero */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Intent Alignment
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${intentMeta.color}`}>
                {intentMeta.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-extrabold ${intentMeta.color}`}>
                {entry.intent_score !== null ? `${entry.intent_score}%` : '—'}
              </span>
              <span className="text-xs text-slate-500">
                consistency with user intent
              </span>
            </div>

            {/* Visual Alignment Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  (entry.intent_score ?? 0) >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : (entry.intent_score ?? 0) >= 40
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-rose-600 to-rose-400'
                }`}
                style={{ width: `${Math.max(4, entry.intent_score ?? 0)}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-1">
            {entry.intent_reason || intentMeta.desc}
          </p>
        </div>

        {/* Risk Score */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Risk Score
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${getRiskColor(entry.risk_score)}`}>
                {entry.risk_level || (entry.risk_score && entry.risk_score >= 85 ? 'CRITICAL' : 'LOW')}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-extrabold ${getRiskColor(entry.risk_score)}`}>
                {entry.risk_score !== null ? `${entry.risk_score}` : '—'}
              </span>
              <span className="text-xs text-slate-500">/ 100 maximum risk</span>
            </div>

            {/* Visual Risk Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  (entry.risk_score ?? 0) >= 85
                    ? 'bg-gradient-to-r from-rose-600 to-rose-500'
                    : (entry.risk_score ?? 0) >= 60
                    ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                    : (entry.risk_score ?? 0) >= 30
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                }`}
                style={{ width: `${Math.max(4, entry.risk_score ?? 0)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Threshold Gate:</span>
            <span className="font-mono text-slate-300">
              {(entry.risk_score ?? 0) >= 85
                ? '≥85 → BLOCK'
                : (entry.risk_score ?? 0) >= 60
                ? '60-84 → APPROVAL'
                : (entry.risk_score ?? 0) >= 30
                ? '30-59 → SANDBOX'
                : '<30 → ALLOW'}
            </span>
          </div>
        </div>
      </div>

      {/* Security Analysis / Why Allowed vs Why Blocked */}
      <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 mb-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>Security Evaluation & Explanation</span>
          <span className="text-[10px] text-slate-500 font-normal">Deterministic rules + Intent check</span>
        </h4>

        <div className="space-y-2">
          {isAllowed ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>Related to user task intent</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>Within allowed project scope</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>No sensitive credential access</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px] font-bold">✓</span>
                <span>No destructive behavior</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              {entry.rule_matched && (
                <div className="flex items-start gap-2 text-rose-400">
                  <span className="w-4 h-4 rounded-full bg-rose-950 border border-rose-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✕</span>
                  <span>
                    <strong>Rule Triggered:</strong> {entry.rule_id} ({entry.rule_severity}) — {entry.reason || "Security violation detected"}
                  </span>
                </div>
              )}
              {(entry.intent_score ?? 100) < 40 && (
                <div className="flex items-start gap-2 text-rose-400">
                  <span className="w-4 h-4 rounded-full bg-rose-950 border border-rose-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✕</span>
                  <span>
                    <strong>Intent Mismatch:</strong> Action target is completely outside the user's intended scope for "{userIntent}"
                  </span>
                </div>
              )}
              {entry.risk_reasons && entry.risk_reasons.length > 0 && entry.risk_reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-500">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Policy Decision Summary Banner */}
      <div className={`p-3.5 rounded-xl border ${decisionMeta.bg} ${decisionMeta.border} flex items-center justify-between gap-4 mb-4`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{decisionMeta.icon}</span>
          <div>
            <div className={`font-bold text-xs uppercase tracking-wider ${decisionMeta.text}`}>
              {decisionMeta.title}
            </div>
            <div className="text-slate-300 text-xs mt-0.5">
              {entry.reason || "Evaluated by Policy Engine threshold matrix."}
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Execution Preview */}
      {entry.execution_result && (
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 mb-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
            <span>Execution Gateway Dispatch</span>
            <span className={isAllowed ? "text-emerald-400" : "text-rose-400"}>
              {isAllowed ? "SIMULATED EXECUTION" : "EXECUTION HALTED"}
            </span>
          </div>
          <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {entry.execution_result}
          </pre>
        </div>
      )}

      {/* Action Footer with Detailed Inspector Trigger */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 font-mono">
          Block #{entry.entry_index ?? 0} · SHA-256 Hash Chain
        </span>
        {onInspectDetails && (
          <button
            onClick={() => onInspectDetails(entry)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <span>🔍</span>
            <span>Inspect Full Proof & Human Overrides</span>
          </button>
        )}
      </div>
    </div>
  );
};
