import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { AuditEntry, Stats, Task, ChainVerification, DecisionType } from '../types';
import { auditApi, demoApi, tasksApi } from '../services/api';
import { Header } from '../components/Header';
import { CurrentIntentPanel } from '../components/CurrentIntentPanel';
import { ActionAnalysisPanel } from '../components/ActionAnalysisPanel';
import { StatsPanel } from '../components/StatsPanel';
import { DemoControls } from '../components/DemoControls';
import { ActivityFeed } from '../components/ActivityFeed';
import { ActionDetailModal } from '../components/ActionDetailModal';
import { CommandLineBar } from '../components/CommandLineBar';
import { LiveConsoleStream } from '../components/LiveConsoleStream';
import { InteractiveMcpTester } from '../components/InteractiveMcpTester';
import { Web3BlockExplorer } from '../components/Web3BlockExplorer';

const POLL_INTERVAL = 3000; // ms

interface ConsoleLine {
  id: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'cmd';
  text: string;
  timestamp: string;
}

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'stream' | 'mcp' | 'web3'>('simulator');
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

  // Live streaming console lines
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    {
      id: 'init-0',
      type: 'info',
      text: '[KERNEL] AgentGuard MCP Reverse Proxy initialized on 127.0.0.1:8000',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-1',
      type: 'success',
      text: '[SHA-256] Cryptographic proof-of-action ledger active (genesis block anchored)',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isConsoleStreaming, setIsConsoleStreaming] = useState(false);

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

  // Dynamic Typewriter / Streaming Line Helper
  const streamStepsToConsole = (steps: { type: ConsoleLine['type']; text: string }[]) => {
    setIsConsoleStreaming(true);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setConsoleLines((prev) => [
          ...prev,
          {
            id: 'line-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            type: step.type,
            text: step.text,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        if (idx === steps.length - 1) {
          setIsConsoleStreaming(false);
        }
      }, (idx + 1) * 280);
    });
  };

  const runDemo = async (
    name: string,
    fn: () => Promise<{ task_id?: string; scenario?: string }>,
    cliCmd?: string
  ) => {
    setDemoLoading(true);
    setActiveScenario(name);
    setError(null);

    // Initial console command indicator
    setConsoleLines((prev) => [
      ...prev,
      {
        id: 'cmd-' + Date.now(),
        type: 'cmd',
        text: `$ ${cliCmd || name.toLowerCase().replace(/\s+/g, '-')}`,
        timestamp: new Date().toLocaleTimeString(),
      },
      {
        id: 'start-' + Date.now(),
        type: 'info',
        text: `[MCP PROXY] Executing simulation: ${name}...`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

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

      // Stream dynamic steps based on scenario
      if (name.includes('Safe')) {
        streamStepsToConsole([
          { type: 'info', text: '[MCP TOOL] Intercepted FILE_READ("src/auth/login.py")' },
          { type: 'success', text: '[TIER-1 AST] Path inside allowed scope ./src/auth/ (PASSED)' },
          { type: 'success', text: '[TIER-2 COSINE] Goal alignment: 95% (Strongly Aligned)' },
          { type: 'success', text: '[POLICY GATEWAY] Decision: ALLOW -> Dispatched safely to workspace' },
          { type: 'info', text: '[WEB3] Action appended to SHA-256 Merkle chain' },
        ]);
      } else if (name.includes('Credential')) {
        streamStepsToConsole([
          { type: 'warn', text: '[MCP TOOL] Intercepted FILE_READ("~/.aws/credentials")' },
          { type: 'error', text: '[TIER-1 AST] SENSITIVE_CREDENTIAL_ACCESS detected! High severity.' },
          { type: 'error', text: '[TIER-2 COSINE] Goal alignment: 2% (Unrelated to task intent)' },
          { type: 'error', text: '[POLICY GATEWAY] Decision: BLOCK (Risk: 99/100). Access terminated.' },
          { type: 'info', text: '[WEB3] Tamper-proof block anchored with violation record' },
        ]);
      } else if (name.includes('Prompt')) {
        streamStepsToConsole([
          { type: 'warn', text: '[MCP TOOL] PR Diff parsed with hidden comment payload' },
          { type: 'error', text: '[INDIRECT INJECTION] Attempting network egress to attacker.com' },
          { type: 'error', text: '[TIER-3 BLAST] Outbound egress prohibited by zero-trust network policy' },
          { type: 'error', text: '[POLICY GATEWAY] Decision: BLOCK. Exfiltration prevented.' },
        ]);
      } else if (name.includes('Slopsquatting')) {
        streamStepsToConsole([
          { type: 'warn', text: '[MCP TOOL] Intercepted COMMAND_EXECUTE("pip install reqeusts")' },
          { type: 'error', text: '[SUPPLY CHAIN] Typosquatting detected: "reqeusts" -> "requests"' },
          { type: 'error', text: '[POLICY GATEWAY] Decision: BLOCK. Setup hook execution aborted.' },
        ]);
      } else if (name.includes('Scope')) {
        streamStepsToConsole([
          { type: 'warn', text: '[MCP TOOL] Intercepted COMMAND_EXECUTE("rm -rf /")' },
          { type: 'error', text: '[BLAST RADIUS] Catastrophic boundary breach outside workspace' },
          { type: 'error', text: '[POLICY GATEWAY] Decision: BLOCK. Destructive deletion prevented.' },
        ]);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Demo execution failed');
      setConsoleLines((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          type: 'error',
          text: `[ERROR] Execution failed: ${err.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleExecuteCommand = (cmd: string) => {
    const clean = cmd.trim().toLowerCase();

    if (clean === 'help') {
      setConsoleLines((prev) => [
        ...prev,
        { id: 'h-' + Date.now(), type: 'cmd', text: `$ ${cmd}`, timestamp: new Date().toLocaleTimeString() },
        { id: 'h1-' + Date.now(), type: 'info', text: 'Available commands:', timestamp: new Date().toLocaleTimeString() },
        { id: 'h2-' + Date.now(), type: 'info', text: '  run safe        - Execute safe bug patch scenario', timestamp: new Date().toLocaleTimeString() },
        { id: 'h3-' + Date.now(), type: 'info', text: '  run theft       - Run credential exfil attack vector', timestamp: new Date().toLocaleTimeString() },
        { id: 'h4-' + Date.now(), type: 'info', text: '  run injection   - Test indirect prompt injection in PR', timestamp: new Date().toLocaleTimeString() },
        { id: 'h5-' + Date.now(), type: 'info', text: '  run slop        - Test typosquatting dependency attack', timestamp: new Date().toLocaleTimeString() },
        { id: 'h6-' + Date.now(), type: 'info', text: '  run blast       - Test unbounded destructive deletion', timestamp: new Date().toLocaleTimeString() },
        { id: 'h7-' + Date.now(), type: 'info', text: '  verify chain    - Recalculate SHA-256 Merkle root', timestamp: new Date().toLocaleTimeString() },
        { id: 'h8-' + Date.now(), type: 'info', text: '  clear           - Clear stdout console window', timestamp: new Date().toLocaleTimeString() },
      ]);
      return;
    }

    if (clean === 'clear') {
      setConsoleLines([]);
      return;
    }

    if (clean.includes('safe')) {
      setActiveTab('simulator');
      runDemo('Safe Demo', demoApi.runSafe, 'run safe');
    } else if (clean.includes('theft') || clean.includes('cred')) {
      setActiveTab('simulator');
      runDemo('Credential Theft Demo', demoApi.runCredentialTheft, 'run theft');
    } else if (clean.includes('inject') || clean.includes('prompt')) {
      setActiveTab('simulator');
      runDemo('Prompt Injection Demo', demoApi.runPromptInjection, 'run injection');
    } else if (clean.includes('slop') || clean.includes('typo')) {
      setActiveTab('simulator');
      runDemo('Slopsquatting Supply-Chain', demoApi.runSlopsquatting, 'run slop');
    } else if (clean.includes('blast') || clean.includes('rm')) {
      setActiveTab('simulator');
      runDemo('Scope Creep & Blast Radius', demoApi.runScopeCreep, 'run blast');
    } else if (clean.includes('verify')) {
      setActiveTab('web3');
      auditApi.verifyChain().then((res) => {
        setConsoleLines((prev) => [
          ...prev,
          { id: 'v1-' + Date.now(), type: 'cmd', text: `$ verify chain`, timestamp: new Date().toLocaleTimeString() },
          { id: 'v2-' + Date.now(), type: 'success', text: `[SHA-256 VALID] ${res.total_blocks} chained blocks verified. Merkle root: ${res.merkle_root.slice(0, 16)}...`, timestamp: new Date().toLocaleTimeString() },
        ]);
        fetchData();
      });
    } else {
      setConsoleLines((prev) => [
        ...prev,
        { id: 'err-' + Date.now(), type: 'cmd', text: `$ ${cmd}`, timestamp: new Date().toLocaleTimeString() },
        { id: 'err2-' + Date.now(), type: 'warn', text: `Unknown command: '${cmd}'. Type 'help' for available commands.`, timestamp: new Date().toLocaleTimeString() },
      ]);
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
    setConsoleLines((prev) => [
      ...prev,
      {
        id: 'ov-' + Date.now(),
        type: 'warn',
        text: `[HUMAN OVERRIDE] Operator updated block ${entryId.slice(0, 8)} to [${newDecision}]. Ledger state updated.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
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

        {/* 1. Compact Security Context HUD (Collapsible) */}
        <CurrentIntentPanel
          currentTask={currentTask}
          scenarioName={activeScenario}
        />

        {/* 2. Interactive Terminal Command Input Bar */}
        <CommandLineBar
          onExecuteCommand={handleExecuteCommand}
          disabled={demoLoading || isConsoleStreaming}
        />

        {/* 3. Compact Real-time Telemetry Ribbon */}
        <StatsPanel stats={stats} loading={statsLoading} />

        {/* 4. Dynamic Workstation Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-800 text-xs select-none overflow-x-auto pt-1">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 font-mono font-bold text-xs transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-zinc-950 text-white border-white'
                : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-700'
            }`}
          >
            <span>[ 01: SIMULATOR ]</span>
          </button>

          <button
            onClick={() => setActiveTab('stream')}
            className={`px-4 py-2 font-mono font-bold text-xs transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stream'
                ? 'bg-zinc-950 text-white border-white'
                : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-700'
            }`}
          >
            <span>[ 02: SYS_STREAM ]</span>
            <span className="px-1.5 py-0.2 bg-zinc-900 text-zinc-300 text-[10px] rounded">
              {entries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-4 py-2 font-mono font-bold text-xs transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mcp'
                ? 'bg-zinc-950 text-white border-white'
                : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-700'
            }`}
          >
            <span>[ 03: MCP_GATEWAY ]</span>
          </button>

          <button
            onClick={() => setActiveTab('web3')}
            className={`px-4 py-2 font-mono font-bold text-xs transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'web3'
                ? 'bg-zinc-950 text-white border-white'
                : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-700'
            }`}
          >
            <span>[ 04: WEB3_LEDGER ]</span>
          </button>
        </div>

        {/* 5. Dynamic Tab Content Areas */}

        {/* TAB 1: ATTACK SIMULATOR (Default Demo Experience) */}
        {activeTab === 'simulator' && (
          <div className="space-y-4 animate-fade-in">
            {/* Demo Attack Vector Scripts */}
            <DemoControls
              onRunSafe={() => runDemo('Safe Demo', demoApi.runSafe, 'run safe')}
              onRunCredentialTheft={() => runDemo('Credential Theft Demo', demoApi.runCredentialTheft, 'run theft')}
              onRunPromptInjection={() => runDemo('Prompt Injection Demo', demoApi.runPromptInjection, 'run injection')}
              onRunSlopsquatting={() => runDemo('Slopsquatting Supply-Chain', demoApi.runSlopsquatting, 'run slop')}
              onRunScopeCreep={() => runDemo('Scope Creep & Blast Radius', demoApi.runScopeCreep, 'run blast')}
              loading={demoLoading}
              activeScenario={activeScenario}
            />

            {/* Dynamic Live Terminal Streamer */}
            <LiveConsoleStream
              lines={consoleLines}
              isStreaming={isConsoleStreaming || demoLoading}
              onClear={() => setConsoleLines([])}
            />

            {/* Action Inspection Breakdown */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-bold px-1">
                <span>&gt; [TARGET_EVALUATION_INSPECTION]</span>
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
          </div>
        )}

        {/* TAB 2: FULL REAL-TIME ACTIVITY FEED STREAM */}
        {activeTab === 'stream' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7">
                <ActivityFeed
                  entries={entries}
                  selectedEntryId={selectedEntry?.id}
                  onSelect={setSelectedEntry}
                  loading={demoLoading}
                />
              </div>
              <div className="lg:col-span-5 space-y-1">
                <div className="text-zinc-500 text-xs font-bold px-1">
                  &gt; [SELECTED_ENTRY_INSPECTOR]
                </div>
                <ActionAnalysisPanel
                  entry={selectedEntry}
                  currentTask={currentTask}
                  onInspectDetails={(e) => setModalEntry(e)}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE MCP TOOL CALL TESTER */}
        {activeTab === 'mcp' && (
          <div className="animate-fade-in">
            <InteractiveMcpTester />
          </div>
        )}

        {/* TAB 4: WEB3 CRYPTOGRAPHIC BLOCK EXPLORER */}
        {activeTab === 'web3' && (
          <div className="animate-fade-in">
            <Web3BlockExplorer
              entries={entries}
              verification={verification}
              onRefresh={fetchData}
            />
          </div>
        )}

        {/* Pipeline Architecture Footer Bar */}
        <div className="bg-black border border-zinc-800 p-3 text-xs text-zinc-400 font-mono shadow-sm mt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <div className="text-zinc-400 font-bold text-[10px] uppercase">
              $ AGENTGUARD_PIPELINE:
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
              <span className="bg-white text-black font-bold px-1.5 py-0.2">
                MCP_PROXY
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 text-zinc-300">
                AST_RULES
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 text-zinc-300">
                COSINE_INTENT
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 text-zinc-300">
                BLAST_CONTAINMENT
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 text-zinc-300">
                POLICY_MATRIX
              </span>
              <span className="text-zinc-600">&rarr;</span>
              <span className="bg-white text-black font-bold px-1.5 py-0.2">
                WEB3_LEDGER
              </span>
            </div>
          </div>
        </div>

        {/* Action Detail & Proof Modal */}
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
