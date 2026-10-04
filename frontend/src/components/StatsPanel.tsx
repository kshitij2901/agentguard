import React from 'react';
import type { Stats } from '../types';

interface Props {
  stats: Stats | null;
  loading: boolean;
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  subtext: string;
  icon: string;
  border?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, subtext, icon, border = 'border-slate-800' }) => (
  <div className={`bg-slate-900 rounded-xl p-4 border ${border} flex flex-col justify-between shadow-lg relative overflow-hidden`}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">{label}</span>
      <span className="text-base">{icon}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <div className={`text-2xl font-black tracking-tight ${color}`}>{value}</div>
    </div>
    <div className="text-[10px] text-slate-500 mt-1">{subtext}</div>
  </div>
);

export const StatsPanel: React.FC<Props> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-slate-900 rounded-xl p-4 border border-slate-800 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Evaluated"
        value={stats.total_actions}
        color="text-white"
        subtext="Actions through pipeline"
        icon="⚡"
      />
      <StatCard
        label="Allowed"
        value={stats.allowed}
        color="text-emerald-400"
        subtext="Within intent boundary"
        icon="✓"
        border="border-emerald-900/30"
      />
      <StatCard
        label="Sandboxed"
        value={stats.sandboxed}
        color="text-amber-400"
        subtext="Isolated execution"
        icon="📦"
        border="border-amber-900/30"
      />
      <StatCard
        label="Approval"
        value={stats.approval_required}
        color="text-orange-400"
        subtext="Human review required"
        icon="⏳"
        border="border-orange-900/30"
      />
      <StatCard
        label="Blocked"
        value={stats.blocked}
        color="text-rose-400"
        subtext="Attacks / deviations halted"
        icon="🚫"
        border="border-rose-900/30"
      />
      <StatCard
        label="Average Risk"
        value={(stats.average_risk ?? 0).toFixed(1)}
        color={
          (stats.average_risk ?? 0) >= 60
            ? 'text-rose-400'
            : (stats.average_risk ?? 0) >= 30
            ? 'text-amber-400'
            : 'text-emerald-400'
        }
        subtext="Composite 0-100 scale"
        icon="📊"
      />
    </div>
  );
};
