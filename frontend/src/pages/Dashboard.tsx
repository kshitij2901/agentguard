import React, { useEffect, useState, useCallback } from 'react';
import type { AuditEntry, Stats, Task } from '../types';
import { auditApi, demoApi, tasksApi } from '../services/api';
import { Header } from '../components/Header';
import { CurrentIntentPanel } from '../components/CurrentIntentPanel';
import { ActionAnalysisPanel } from '../components/ActionAnalysisPanel';
import { StatsPanel } from '../components/StatsPanel';
import { DemoControls } from '../components/DemoControls';
import { ActivityFeed } from '../components/ActivityFeed';

const POLL_INTERVAL = 2000; // ms

export const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [logsRes, statsRes, tasksRes] = await Promise.all([
        auditApi.getLogs(),
        auditApi.getStats(),
        tasksApi.list().catch(() => ({ data: [] as Task[] })),
      ]);

      const logData = logsRes.data;
      setEntries(logData);
      setStats(statsRes.data);

      const tasks = tasksRes.data;
      if (tasks && tasks.length > 0) {
        setCurrentTask(tasks[0]); // most recent active task
      }

      // If no entry is currently selected or user just loaded, default to the latest log entry
      setSelectedEntry((prev) => {
        if (!prev && logData.length > 0) {
          return logData[0];
        }
        // If current selected entry is in logData, keep it refreshed
        if (prev) {
          const match = logData.find((e) => e.id === prev.id);
          return match || prev;
        }
        return null;
      });

      setStatsLoading(false);
      setError(null);
    } catch {
      setError('Cannot reach AgentGuard backend. Make sure it is running on http://localhost:8000');
      setStatsLoading(false);
    }
  }, []);

  // Poll every 2 seconds for live telemetry
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const runDemo = async (name: string, fn: () => Promise<{ data: { task_id?: string; scenario?: string } }>) => {
    setDemoLoading(true);
    setActiveScenario(name);
    setError(null);
    try {
      const res = await fn();
      await fetchData();

      // If scenario returned task_id, fetch that specific task
      if (res.data?.task_id) {
        try {
          const tRes = await tasksApi.get(res.data.task_id);
          setCurrentTask(tRes.data);
        } catch {
          // ignore
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err.response?.data?.detail || err.message || 'Demo execution failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500 selection:text-white pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-700/80 rounded-2xl px-5 py-3.5 text-rose-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchData()}
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 rounded-lg text-white font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Current User Intent Panel */}
        <CurrentIntentPanel
          currentTask={currentTask}
          scenarioName={activeScenario}
        />

        {/* 2. Demo Controls */}
        <DemoControls
          onRunSafe={() => runDemo('Safe Demo', demoApi.runSafe)}
          onRunCredentialTheft={() => runDemo('Credential Theft Demo', demoApi.runCredentialTheft)}
          onRunPromptInjection={() => runDemo('Prompt Injection Demo', demoApi.runPromptInjection)}
          loading={demoLoading}
          activeScenario={activeScenario}
        />

        {/* 3. Hero Security Grid: Action Analysis (Left/Hero) + Live Activity (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Action Analysis Panel (Hero Inspector) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span>🔍</span> Selected Action Inspection
              </h3>
              {selectedEntry && (
                <span className="text-[11px] text-slate-500 font-mono">
                  ID: {selectedEntry.id.slice(0, 8)}...
                </span>
              )}
            </div>
            <ActionAnalysisPanel
              entry={selectedEntry}
              currentTask={currentTask}
            />
          </div>

          {/* Activity Feed Table */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span>📡</span> Live Security Stream
              </h3>
              <span className="text-[11px] text-slate-500">
                Click any row to inspect
              </span>
            </div>
            <ActivityFeed
              entries={entries}
              selectedEntryId={selectedEntry?.id}
              onSelect={setSelectedEntry}
              loading={demoLoading}
            />
          </div>
        </div>

        {/* 4. Telemetry Overview Stats */}
        <section className="pt-2">
          <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
            <span>📊</span> Session Telemetry
          </h3>
          <StatsPanel stats={stats} loading={statsLoading} />
        </section>

        {/* 5. Pipeline Architecture Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                AgentGuard Pipeline:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Agent Action</span>
              <span className="text-slate-600">→</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Rule Engine</span>
              <span className="text-slate-600">→</span>
              <span className="bg-blue-950 px-2 py-0.5 rounded text-blue-300 font-bold border border-blue-800">Intent Engine</span>
              <span className="text-slate-600">→</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Risk Engine</span>
              <span className="text-slate-600">→</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Policy Engine</span>
              <span className="text-slate-600">→</span>
              <span className="bg-emerald-950 px-2 py-0.5 rounded text-emerald-300 font-bold border border-emerald-800">Decision</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
