import axios from 'axios';
import type { AuditEntry, Stats, DemoResult, Task } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
});

// ── Tasks ────────────────────────────────────────────────────────────────

export const tasksApi = {
  create: (data: Partial<Task>) =>
    api.post<Task>('/api/tasks/', data),
  get: (id: string) =>
    api.get<Task>(`/api/tasks/${id}`),
  list: () =>
    api.get<Task[]>('/api/tasks/'),
};

// ── Audit ────────────────────────────────────────────────────────────────

export const auditApi = {
  getLogs: (taskId?: string) =>
    api.get<AuditEntry[]>('/api/audit', {
      params: taskId ? { task_id: taskId } : undefined,
    }),
  getStats: () =>
    api.get<Stats>('/api/stats'),
};

// ── Demo scenarios ───────────────────────────────────────────────────────

export const demoApi = {
  runSafe: () =>
    api.post<DemoResult>('/api/demo/safe'),
  runCredentialTheft: () =>
    api.post<DemoResult>('/api/demo/credential-theft'),
  runPromptInjection: () =>
    api.post<DemoResult>('/api/demo/prompt-injection'),
};
