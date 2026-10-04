import React from 'react';
import type { Stats } from '../types';

interface Props {
  stats: Stats | null;
  loading: boolean;
}

interface StatCardProps {
  index: string;
  label: string;
  value: number | string;
  subtext: string;
  inverted?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ index, label, value, subtext, inverted }) => (
  <div
    className={`p-3.5 border font-mono flex flex-col justify-between shadow-sm ${
      inverted
        ? 'bg-white text-black border-white'
        : 'bg-black text-white border-zinc-800'
    }`}
  >
    <div className="flex items-center justify-between text-[10px] mb-2">
      <span className={inverted ? 'text-zinc-600 font-bold' : 'text-zinc-500 font-bold'}>
        [{index}] {label}
      </span>
      <span className={inverted ? 'text-zinc-400' : 'text-zinc-600'}>STAT</span>
    </div>
    <div className="text-2xl font-bold font-mono tracking-tight my-1">
      {value}
    </div>
    <div className={`text-[10px] truncate ${inverted ? 'text-zinc-700' : 'text-zinc-500'}`}>
      {subtext}
    </div>
  </div>
);

export const StatsPanel: React.FC<Props> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-black border border-zinc-800 p-4 h-24 animate-pulse flex items-center justify-center text-zinc-600 text-xs">
            [LOADING...]
          </div>
        ))}
      </div>
    );
  }

  const avgRisk = (stats.average_risk ?? 0).toFixed(1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
      <StatCard
        index="01"
        label="EVALUATED"
        value={stats.total_actions}
        subtext="Total actions passed"
      />
      <StatCard
        index="02"
        label="ALLOWED"
        value={stats.allowed}
        subtext="Within intent boundary"
      />
      <StatCard
        index="03"
        label="SANDBOXED"
        value={stats.sandboxed}
        subtext="Isolated in sandbox"
      />
      <StatCard
        index="04"
        label="APPROVAL"
        value={stats.approval_required}
        subtext="Human review needed"
      />
      <StatCard
        index="05"
        label="BLOCKED"
        value={stats.blocked}
        subtext="Attacks halted"
        inverted={stats.blocked > 0}
      />
      <StatCard
        index="06"
        label="AVG_RISK"
        value={avgRisk}
        subtext="0-100 composite index"
      />
    </div>
  );
};
