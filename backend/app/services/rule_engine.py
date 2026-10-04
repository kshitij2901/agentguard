"""
Heuristic Rule Engine
=====================
Evaluates an action against a catalogue of deterministic security rules.
Rules are plain dataclasses — adding a new rule is a one-line change to
the relevant list; no logic needs to be modified.

Implements: RuleEngineInterface
"""

import re
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List

from app.services.interfaces import RuleEngineInterface


# ---------------------------------------------------------------------------
# Rule dataclass
# ---------------------------------------------------------------------------

@dataclass
class Rule:
    rule_id: str
    severity: str                           # INFO | LOW | MEDIUM | HIGH | CRITICAL
    reason: str
    action_types: List[str]                 # empty list = match all action types
    patterns: List[str]                     # regex patterns tested against target (lower-cased)
    description_patterns: List[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Rule catalogue
# ---------------------------------------------------------------------------

SENSITIVE_FILE_RULES: List[Rule] = [
    Rule(
        rule_id="SENSITIVE_CREDENTIAL_ACCESS",
        severity="CRITICAL",
        reason="Attempt to access cloud credentials",
        action_types=["FILE_READ", "FILE_WRITE", "COMMAND_EXECUTE"],
        patterns=[r"\.aws", r"credentials", r"\.env(?:\.\w+)?$", r"^\.env$"],
    ),
    Rule(
        rule_id="SENSITIVE_SSH_ACCESS",
        severity="CRITICAL",
        reason="Attempt to access SSH keys",
        action_types=["FILE_READ", "FILE_WRITE", "COMMAND_EXECUTE"],
        patterns=[r"\.ssh", r"\bid_rsa\b", r"\bid_ed25519\b", r"\bid_dsa\b", r"authorized_keys"],
    ),
    Rule(
        rule_id="SENSITIVE_PRIVATE_KEY",
        severity="CRITICAL",
        reason="Attempt to access private key material",
        action_types=["FILE_READ", "FILE_WRITE"],
        patterns=[r"private[_\-]?key", r"\.pem$", r"\.p12$", r"\.pfx$"],
    ),
    Rule(
        rule_id="SENSITIVE_SYSTEM_SECRETS",
        severity="HIGH",
        reason="Attempt to access system secret files",
        action_types=["FILE_READ", "FILE_WRITE", "COMMAND_EXECUTE"],
        patterns=[r"/etc/passwd", r"/etc/shadow", r"/etc/sudoers"],
    ),
    Rule(
        rule_id="SENSITIVE_CONFIG_FILE",
        severity="HIGH",
        reason="Attempt to access sensitive configuration file",
        action_types=["FILE_READ", "FILE_WRITE"],
        patterns=[r"secrets?\.json", r"secrets?\.ya?ml"],
    ),
]

DANGEROUS_COMMAND_RULES: List[Rule] = [
    Rule(
        rule_id="DANGEROUS_SUDO",
        severity="HIGH",
        reason="Attempt to use elevated (sudo) privileges",
        action_types=["COMMAND_EXECUTE"],
        patterns=[r"\bsudo\b"],
    ),
    Rule(
        rule_id="DANGEROUS_RM_RF",
        severity="CRITICAL",
        reason="Attempt to recursively delete files",
        action_types=["COMMAND_EXECUTE"],
        patterns=[r"\brm\b\s+.*-[a-z]*r[a-z]*f|\brm\b\s+.*-[a-z]*f[a-z]*r"],
    ),
    Rule(
        rule_id="DANGEROUS_CHMOD_777",
        severity="HIGH",
        reason="Attempt to make files world-writable",
        action_types=["COMMAND_EXECUTE"],
        patterns=[r"\bchmod\b\s+777"],
    ),
    Rule(
        rule_id="DANGEROUS_PIPE_SHELL",
        severity="CRITICAL",
        reason="Attempt to pipe remote code into shell executor",
        action_types=["COMMAND_EXECUTE"],
        patterns=[r"curl\b.*\|\s*(?:bash|sh)\b", r"wget\b.*\|\s*(?:bash|sh)\b"],
    ),
    Rule(
        rule_id="DANGEROUS_DROP_DATABASE",
        severity="CRITICAL",
        reason="Attempt to destroy a database",
        action_types=["COMMAND_EXECUTE"],
        patterns=[r"\bDROP\s+DATABASE\b", r"\bDROP\s+TABLE\b"],
    ),
    Rule(
        rule_id="DANGEROUS_CAT_SECRETS",
        severity="CRITICAL",
        reason="Attempt to print secret files via command",
        action_types=["COMMAND_EXECUTE"],
        patterns=[
            r"\bcat\b.*(?:credentials|\.env|\.aws|\.ssh|id_rsa|passwd|shadow)",
            r"\bless\b.*(?:credentials|\.env|\.aws|\.ssh|id_rsa)",
        ],
    ),
    Rule(
        rule_id="DANGEROUS_PACKAGE_INSTALL",
        severity="MEDIUM",
        reason="Package installation detected",
        action_types=["COMMAND_EXECUTE"],
        patterns=[r"\bpip\s+install\b", r"\bnpm\s+install\b", r"\bapt(?:-get)?\s+install\b"],
    ),
    Rule(
        rule_id="DANGEROUS_BLAST_RADIUS_DELETION",
        severity="CRITICAL",
        reason="Unbounded destructive deletion outside workspace boundary (critical blast radius breach)",
        action_types=["COMMAND_EXECUTE"],
        patterns=[r"\brm\b\s+-[a-zA-Z]*rf\s+(?:/|~|\.\.|\*|/\*|\$HOME)"],
    ),
]

SUPPLY_CHAIN_RULES: List[Rule] = [
    Rule(
        rule_id="SUPPLY_CHAIN_TYPOSQUAT",
        severity="CRITICAL",
        reason="Potential typosquatted or slopsquatted package detected in install command",
        action_types=["COMMAND_EXECUTE"],
        patterns=[
            r"\b(?:pip\s+install|npm\s+i(?:nstall)?|yarn\s+add)\s+.*(?:\breqeusts\b|\bcoloramaa\b|\bexpresss\b|\blodashe\b|\bchokidarr\b|\bcross-envv\b|\bcryptographyy\b|\burllib4\b|\bbeutifulsoup\b|\bpydanticc\b|\bfastapii\b|\bweb3pyy\b)",
            r"(?:--trusted-host\s+\S*evil|--insecure\s+http://)",
        ],
    ),
]

NETWORK_RULES: List[Rule] = [
    Rule(
        rule_id="EXTERNAL_NETWORK_REQUEST",
        severity="HIGH",
        reason="External network request detected",
        action_types=["NETWORK_REQUEST"],
        patterns=[r".*"],   # every network request is flagged
    ),
    Rule(
        rule_id="EXFILTRATION_PATTERN",
        severity="CRITICAL",
        reason="Potential data exfiltration URL pattern detected",
        action_types=["NETWORK_REQUEST", "COMMAND_EXECUTE"],
        patterns=[r"exfil", r"collect\?", r"steal", r"upload.*secret", r"evil\.com", r"attacker\.com"],
    ),
    Rule(
        rule_id="INDIRECT_PROMPT_INJECTION_EXFIL",
        severity="CRITICAL",
        reason="Indirect prompt injection: outbound credential or token transmission",
        action_types=["NETWORK_REQUEST", "COMMAND_EXECUTE"],
        patterns=[
            r"(?:curl|wget)\b.*(?:credentials|\.env|id_rsa|token=|api_key|secret).*(?:https?://|evil|attacker|webhook|requestbin)",
        ],
    ),
]

GIT_RULES: List[Rule] = [
    Rule(
        rule_id="GIT_PUSH",
        severity="HIGH",
        reason="Git push to remote repository",
        action_types=["GIT_OPERATION"],
        patterns=[r"\bpush\b"],
    ),
]

ALL_RULES: List[Rule] = (
    SENSITIVE_FILE_RULES
    + DANGEROUS_COMMAND_RULES
    + SUPPLY_CHAIN_RULES
    + NETWORK_RULES
    + GIT_RULES
)

_SEVERITY_ORDER = {"INFO": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}


# ---------------------------------------------------------------------------
# Concrete engine
# ---------------------------------------------------------------------------

class HeuristicRuleEngine(RuleEngineInterface):
    """
    Pattern-based rule engine.  O(rules × patterns) per evaluation.
    Thread-safe: stateless after construction.
    """

    def __init__(self, rules: Optional[List[Rule]] = None) -> None:
        self.rules = rules if rules is not None else ALL_RULES

    def evaluate(
        self,
        action_type: str,
        target: str,
        description: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        target_lc = target.lower()
        desc_lc = (description or "").lower()
        matched_rules: List[Rule] = []

        for rule in self.rules:
            # Skip if rule doesn't apply to this action type
            if rule.action_types and action_type not in rule.action_types:
                continue

            hit = any(
                re.search(pat, target_lc, re.IGNORECASE) for pat in rule.patterns
            )
            if not hit and rule.description_patterns:
                hit = any(
                    re.search(pat, desc_lc, re.IGNORECASE)
                    for pat in rule.description_patterns
                )
            if hit:
                matched_rules.append(rule)

        if not matched_rules:
            return {"matched": False, "severity": None, "reason": None, "rule_id": None}

        worst = max(matched_rules, key=lambda r: _SEVERITY_ORDER.get(r.severity, 0))
        return {
            "matched": True,
            "severity": worst.severity,
            "reason": worst.reason,
            "rule_id": worst.rule_id,
        }
