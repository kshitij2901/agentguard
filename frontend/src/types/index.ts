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
  entry_index?: number;
  prev_hash?: string | null;
  entry_hash?: string | null;
  merkle_root?: string | null;
  anchor_tx_hash?: string | null;
  tier_analysis?: {
    tier1_ast_pass?: boolean;
    tier1_suspicion_penalty?: number;
    tier2_cosine_similarity?: number;
    tier2_semantic_score?: number;
    tier2_method?: string;
    tier3_blast_radius?: {
      scope_breach?: boolean;
      destructive_impact?: number;
      external_egress?: boolean;
      blast_score?: number;
      blast_level?: string;
    };
  } | null;
}

export interface Stats {
  total_actions: number;
  allowed: number;
  sandboxed: number;
  approval_required: number;
  blocked: number;
  average_risk: number;
  chain_valid?: boolean;
  merkle_root?: string;
  latest_anchor_tx?: string;
}

export interface ChainVerification {
  is_valid: boolean;
  total_blocks: number;
  chain_status: string;
  merkle_root: string;
  latest_anchor_tx: string | null;
  verified_blocks: number;
  integrity_percent: number;
  failed_at?: string | null;
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
  block_hash?: string;
  tier_analysis?: AuditEntry['tier_analysis'];
}

export interface DemoResult {
  scenario: string;
  goal: string;
  task_id: string;
  actions_evaluated: number;
  results: DemoActionResult[];
}
