export type DecisionType = 'ALLOW' | 'SANDBOX' | 'APPROVAL_REQUIRED' | 'BLOCK';
export type RiskLevel = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActionType =
  | 'FILE_READ'
  | 'FILE_WRITE'
  | 'COMMAND_EXECUTE'
  | 'NETWORK_REQUEST'
  | 'GIT_OPERATION';

export interface Task {
  id: string;
  goal: string;
  allowed_paths: string[];
  sensitive_access_allowed: boolean;
  network_access_allowed: boolean;
  destructive_actions_allowed: boolean;
  git_push_allowed: boolean;
  created_at: string;
  is_active: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  task_id: string;
  task_goal?: string | null;
  action_id: string | null;
  action_type: ActionType | null;
  action_target: string | null;
  action_description: string | null;
  rule_matched: boolean | null;
  rule_severity: string | null;
  rule_id: string | null;
  intent_score: number | null;  // 0-100
  intent_reason?: string | null;
  risk_score: number | null;    // 0-100
  risk_level: RiskLevel | null;
  risk_reasons?: string[] | null;
  decision: DecisionType;
  reason: string | null;
  execution_result: string | null;
}

export interface Stats {
  total_actions: number;
  allowed: number;
  sandboxed: number;
  approval_required: number;
  blocked: number;
  average_risk: number;
}

export interface DemoActionResult {
  action_type: ActionType;
  action_target: string;
  intent_score: number;
  risk_score: number;
  risk_level: RiskLevel;
  decision: DecisionType;
  reason: string;
  rule_matched: boolean;
  rule_id: string | null;
  execution_result: string | null;
}

export interface DemoResult {
  scenario: string;
  goal: string;
  task_id: string;
  actions_evaluated: number;
  results: DemoActionResult[];
}
