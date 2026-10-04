import React from 'react';
import type { Stats } from '../types';

interface Props {
  stats: Stats | null;
  loading: boolean;
}

export const StatsPanel: React.FC<Props> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="bg-black border border-zinc-800 p-2.5 font-mono text-xs text-zinc-600 flex items-center justify-between animate-pulse">
        <span>&gt; [SESSION_TELEMETRY: SYNCHRONIZING REALTIME METRICS...]</span>
        <span>[--]</span>
      </div>
    );
  }

  const avgRisk = (stats.average_risk ?? 0).toFixed(1);

  return (
    <div className="bg-black border border-zinc-800 p-2.5 font-mono text-xs shadow-sm flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-term-pulse" />
        <span className="text-zinc-500 font-bold text-[10px] uppercase">
          TELEMETRY_INDEX:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="text-zinc-400">
          ACTIONS: <strong className="text-white font-bold">{stats.total_actions}</strong>
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400">
          ALLOWED: <strong className="text-zinc-200 font-bold">{stats.allowed}</strong>
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400">
          BLOCKED: <strong className="text-white bg-zinc-900 border border-zinc-700 px-1 font-bold">{stats.blocked}</strong>
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400">
          SANDBOXED: <strong className="text-zinc-300 font-bold">{stats.sandboxed}</strong>
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-400">
          AVG_RISK: <strong className="text-white font-bold">{avgRisk}/100</strong>
        </span>
      </div>

      <div className="text-[10px] text-zinc-500 hidden lg:inline">
        GATEWAY_STATUS: ACTIVE
      </div>
    </div>
  );
};
