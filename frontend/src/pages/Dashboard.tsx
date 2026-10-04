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
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="bg-black border border-white p-3 text-xs text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <span className="font-bold">[!]</span>
              <span>ERROR: {error}</span>
            </div>
            <button
              onClick={() => fetchData()}
              className="px-2.5 py-1 bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              $ retry
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
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-bold px-1">
              <span>&gt; [01_ACTION_INSPECTION]</span>
              {selectedEntry && (
                <span className="text-[11px] text-zinc-500 font-mono">
                  REF: {selectedEntry.id.slice(0, 8)}
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
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-bold px-1">
              <span>&gt; [02_SYS_LOG_STREAM]</span>
              <span className="text-[11px] text-zinc-500 font-normal">
                Click row to inspect trace
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
          <div className="text-zinc-500 text-xs font-bold mb-2 px-1">
            &gt; [03_SESSION_TELEMETRY_INDEX]
          </div>
          <StatsPanel stats={stats} loading={statsLoading} />
        </section>

        {/* 6. Terminal ASCII Architecture Pipeline Banner */}
        <div className="bg-black border border-zinc-800 p-3.5 text-xs text-zinc-400 font-mono shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <div className="text-zinc-300 font-bold text-[11px] uppercase">
              $ AGENTGUARD_ARCHITECTURE_PIPELINE:
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <span className="bg-white text-black font-bold px-1.5 py-0.5">
                MCP_PROXY
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-zinc-200">
                AST_RULES
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-zinc-200">
                COSINE_INTENT
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-zinc-200">
                BLAST_RADIUS
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-zinc-200">
                POLICY_MATRIX
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-white text-black font-bold px-1.5 py-0.5">
                WEB3_LEDGER
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
