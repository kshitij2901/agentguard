import React, { useEffect, useState, useCallback } from 'react';
import type { AuditEntry, Stats, Task, ChainVerification, DecisionType } from '../types';
import { auditApi, demoApi, tasksApi } from '../services/api';
import { Header } from '../components/Header';
import { CurrentIntentPanel } from '../components/CurrentIntentPanel';
import { ActionAnalysisPanel } from '../components/ActionAnalysisPanel';
import { StatsPanel } from '../components/StatsPanel';
import { DemoControls } from '../components/DemoControls';
import { ActivityFeed } from '../components/ActivityFeed';
import { Web3IntegrityBanner } from '../components/Web3IntegrityBanner';
import { ActionDetailModal } from '../components/ActionDetailModal';

const POLL_INTERVAL = 3000; // ms

export const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [verification, setVerification] = useState<ChainVerification | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [modalEntry, setModalEntry] = useState<AuditEntry | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [logData, statsData, verData, tasks] = await Promise.all([
        auditApi.getLogs(),
        auditApi.getStats(),
        auditApi.verifyChain().catch(() => null),
        tasksApi.list().catch(() => [] as Task[]),
      ]);

      const safeLogs = Array.isArray(logData) ? logData : [];
      setEntries(safeLogs);

      if (statsData && typeof statsData === 'object' && typeof statsData.total_actions === 'number') {
        setStats(statsData);
      }
      if (verData && typeof verData === 'object') {
        setVerification(verData);
      }

      if (Array.isArray(tasks) && tasks.length > 0) {
        setCurrentTask(tasks[0]);
      } else {
        setCurrentTask((prev) => prev || {
          id: 'task-auth-fix',
          goal: 'Fix authentication bug in login handler',
          allowed_paths: ['src/auth', 'tests/auth'],
          sensitive_access_allowed: false,
          network_access_allowed: false,
          destructive_actions_allowed: false,
          git_push_allowed: false,
          created_at: new Date().toISOString(),
          is_active: true,
        });
      }

      setSelectedEntry((prev) => {
        if (!prev && safeLogs.length > 0) {
          return safeLogs[0];
        }
        if (prev) {
          const match = safeLogs.find((e) => e.id === prev.id);
          return match || prev;
        }
        return safeLogs.length > 0 ? safeLogs[0] : null;
      });

      setStatsLoading(false);
      setError(null);
    } catch {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const runDemo = async (name: string, fn: () => Promise<{ task_id?: string; scenario?: string }>) => {
    setDemoLoading(true);
    setActiveScenario(name);
    setError(null);
    try {
      const res = await fn();
      await fetchData();

      if (res.task_id) {
        try {
          const tRes = await tasksApi.get(res.task_id);
          setCurrentTask(tRes);
        } catch {
          // ignore
        }
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Demo execution failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleOverrideDecision = (entryId: string, newDecision: DecisionType) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              decision: newDecision,
              reason: `[HUMAN OVERRIDE] Decision updated to ${newDecision} by developer in dashboard.`,
            }
          : e
      )
    );
    setSelectedEntry((prev) =>
      prev && prev.id === entryId
        ? {
            ...prev,
            decision: newDecision,
            reason: `[HUMAN OVERRIDE] Decision updated to ${newDecision} by developer in dashboard.`,
          }
        : prev
    );
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
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 rounded-lg text-white font-semibold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Web3 Cryptographic Proof-of-Action Banner */}
        <Web3IntegrityBanner
          verification={verification}
          onRefresh={fetchData}
        />

        {/* 2. Current User Intent Panel */}
        <CurrentIntentPanel
          currentTask={currentTask}
          scenarioName={activeScenario}
        />

        {/* 3. Demo Controls with 5 Attack Vectors */}
        <DemoControls
          onRunSafe={() => runDemo('Safe Demo', demoApi.runSafe)}
          onRunCredentialTheft={() => runDemo('Credential Theft Demo', demoApi.runCredentialTheft)}
          onRunPromptInjection={() => runDemo('Prompt Injection Demo', demoApi.runPromptInjection)}
          onRunSlopsquatting={() => runDemo('Slopsquatting Supply-Chain', demoApi.runSlopsquatting)}
          onRunScopeCreep={() => runDemo('Scope Creep & Blast Radius', demoApi.runScopeCreep)}
          loading={demoLoading}
          activeScenario={activeScenario}
        />

        {/* 4. Hero Security Grid: Action Analysis + Live Activity */}
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
              onInspectDetails={(e) => setModalEntry(e)}
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

        {/* 5. Telemetry Overview Stats */}
        <section className="pt-2">
          <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
            <span>📊</span> Session Telemetry
          </h3>
          <StatsPanel stats={stats} loading={statsLoading} />
        </section>

        {/* 6. Pipeline Architecture Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                AgentGuard Architecture:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span className="bg-emerald-950 px-2 py-0.5 rounded text-emerald-300 font-semibold border border-emerald-800">
                MCP Reverse Proxy
              </span>
              <span className="text-slate-600">→</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Rule Engine (AST)</span>
              <span className="text-slate-600">→</span>
              <span className="bg-blue-950 px-2 py-0.5 rounded text-blue-300 font-bold border border-blue-800">
                Vector Cosine Intent
              </span>
              <span className="text-slate-600">→</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Blast Radius Analyzer</span>
              <span className="text-slate-600">→</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">Policy Engine</span>
              <span className="text-slate-600">→</span>
              <span className="bg-purple-950 px-2 py-0.5 rounded text-purple-300 font-bold border border-purple-800">
                Web3 SHA-256 Ledger
              </span>
            </div>
          </div>
        </div>

        {/* 7. Action Detail & Web3 Proof Modal with Human Overrides */}
        {modalEntry && (
          <ActionDetailModal
            entry={modalEntry}
            onClose={() => setModalEntry(null)}
            onOverrideDecision={handleOverrideDecision}
          />
        )}
      </main>
    </div>
  );
};
