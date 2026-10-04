"""
Heuristic Intent Engine
=======================
Calculates an intent alignment score between a user's task goal and a
proposed agent action using keyword expansion, path matching, and
suspicion detection.

No external dependencies; no LLM calls.  The interface is designed so
that LLMIntentEngine / EmbeddingIntentEngine can be swapped in later
without touching the interceptor or any route.

Implements: IntentEngineInterface
"""

import math
import re
from collections import Counter
from typing import Optional, Dict, Any, List

from app.services.interfaces import IntentEngineInterface


def _vectorize_text(text: str) -> Dict[str, float]:
    tokens = re.findall(r"\w+", text.lower())
    if not tokens:
        return {}
    vec = Counter(tokens)
    for i in range(len(tokens) - 1):
        vec[f"{tokens[i]}_{tokens[i+1]}"] += 1.0
    return dict(vec)


def _cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    if not vec1 or not vec2:
        return 0.0
    intersection = set(vec1.keys()) & set(vec2.keys())
    dot = sum(vec1[k] * vec2[k] for k in intersection)
    mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return min(1.0, max(0.0, dot / (mag1 * mag2)))


# ---------------------------------------------------------------------------
# Concept-keyword expansion map
# Allows "Fix authentication bug" to match "login", "session", "jwt", etc.
# ---------------------------------------------------------------------------
CONCEPT_KEYWORDS: Dict[str, List[str]] = {
    "auth": [
        "auth", "login", "logout", "password", "token", "session",
        "jwt", "oauth", "authentication", "authorization", "credential",
        "signup", "register", "user", "account",
    ],
    "test": [
        "test", "pytest", "unittest", "spec", "coverage", "assert",
        "fixture", "mock", "stub",
    ],
    "bug": ["bug", "fix", "error", "issue", "debug", "patch", "hotfix", "repair"],
    "api": ["api", "endpoint", "route", "request", "response", "rest", "graphql"],
    "database": [
        "database", "db", "sql", "migration", "model", "schema",
        "query", "orm", "table",
    ],
    "frontend": [
        "frontend", "ui", "component", "react", "css", "html", "template",
        "view", "page", "style",
    ],
    "deploy": [
        "deploy", "build", "release", "docker", "ci", "cd", "pipeline",
        "artifact", "publish",
    ],
    "security": [
        "security", "secure", "encrypt", "hash", "salt", "vulnerability",
        "cve", "pen", "audit",
    ],
    "review": [
        "review", "pr", "pull", "merge", "diff", "code review",
        "comment", "approve",
    ],
}

# Paths that are nearly always suspicious regardless of task goal
_ALWAYS_SUSPICIOUS: List[str] = [
    r"\.aws",
    r"\.ssh",
    r"\bcredentials?\b",
    r"private[_\-]?key",
    r"\bid_rsa\b",
    r"\bid_ed25519\b",
    r"etc[/\\]passwd",
    r"etc[/\\]shadow",
    r"~[/\\].*(?:credential|secret|password|token)",
]

# Patterns that indicate an external / exfiltration target
_EXTERNAL_TARGETS: List[str] = [
    r"https?://",
    r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",
    r"exfil",
    r"attacker\.",
    r"evil\.",
]

# Base relevance score for each action type (how inherently risky/relevant)
_ACTION_BASE_RELEVANCE: Dict[str, float] = {
    "FILE_READ": 0.80,
    "FILE_WRITE": 0.75,
    "COMMAND_EXECUTE": 0.65,
    "GIT_OPERATION": 0.55,
    "NETWORK_REQUEST": 0.30,
}


class HeuristicIntentEngine(IntentEngineInterface):
    """
    Deterministic intent alignment engine.
    Combines:
      1. Keyword alignment between goal and action (40 %)
      2. Allowed-path membership (25 %)
      3. Action-type base relevance (20 %)
      4. Fixed base score (15 %)
    Then applies a suspicion penalty multiplicatively.
    """

    def analyze(
        self,
        task_goal: str,
        allowed_paths: List[str],
        action_type: str,
        target: str,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        keyword_score = self._keyword_alignment(task_goal, target, description)
        path_score = self._path_alignment(target, allowed_paths)
        action_score = _ACTION_BASE_RELEVANCE.get(action_type, 0.50)
        suspicion_penalty = self._suspicion_penalty(target, action_type)

        # Tier 2: Vector Cosine Similarity
        vec_goal = _vectorize_text(task_goal)
        vec_action = _vectorize_text(f"{target} {description or ''}")
        cosine_sim = _cosine_similarity(vec_goal, vec_action)

        # Blend keyword alignment with vector cosine similarity
        semantic_blended = (keyword_score * 0.60) + (cosine_sim * 0.40)

        raw = (
            semantic_blended * 0.40
            + path_score * 0.25
            + action_score * 0.20
            + 0.15  # base contribution
        )
        score = raw * (1.0 - suspicion_penalty)
        score = max(0.0, min(1.0, score))
        score_percent = int(score * 100)

        # Tier 3: Consequence Simulation & Blast Radius
        destructive_potential = 9 if re.search(r"rm\s+-|drop\s+table|delete|chmod\s+777", target, re.I) else (4 if action_type == "FILE_WRITE" else 1)
        external_egress = bool(re.search(r"https?://|\.com|\.org|\d{1,3}\.\d{1,3}", target, re.I))
        scope_breach = path_score < 0.5 and len(allowed_paths) > 0
        blast_score = int(
            (destructive_potential * 5)
            + (25 if external_egress else 0)
            + (25 if scope_breach else 0)
            + (int(suspicion_penalty * 40))
        )
        blast_level = "CRITICAL" if blast_score >= 65 else ("HIGH" if blast_score >= 35 else "CONTAINED")

        tier_analysis = {
            "tier1_ast_pass": suspicion_penalty < 0.5,
            "tier1_suspicion_penalty": round(suspicion_penalty, 2),
            "tier2_cosine_similarity": round(cosine_sim, 4),
            "tier2_semantic_score": round(semantic_blended, 4),
            "tier2_method": "VECTOR_COSINE_SIMILARITY",
            "tier3_blast_radius": {
                "scope_breach": scope_breach,
                "destructive_impact": destructive_potential,
                "external_egress": external_egress,
                "blast_score": min(100, blast_score),
                "blast_level": blast_level,
            },
        }

        reason = self._generate_reason(
            task_goal, target, score, keyword_score, path_score, suspicion_penalty
        )
        return {
            "score": round(score, 4),
            "score_percent": score_percent,
            "reason": reason,
            "tier_analysis": tier_analysis,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _keyword_alignment(
        self, goal: str, target: str, description: Optional[str]
    ) -> float:
        goal_lc = goal.lower()
        combined = f"{target.lower()} {(description or '').lower()}"
        combined_words = set(re.findall(r"\w+", combined))

        # Build expanded keyword set from the goal
        expanded: set = set(re.findall(r"\w+", goal_lc))
        for concept_words in CONCEPT_KEYWORDS.values():
            if any(kw in goal_lc for kw in concept_words):
                expanded.update(concept_words)

        if not expanded:
            return 0.5

        overlap = expanded & combined_words
        # Scale: full overlap is rare, so boost by 2×, cap at 1.0
        return min(1.0, len(overlap) / max(len(expanded), 1) * 2.5)

    def _path_alignment(self, target: str, allowed_paths: List[str]) -> float:
        if not allowed_paths:
            return 0.5  # neutral when no paths specified

        norm_target = target.replace("\\", "/").lower()
        for path in allowed_paths:
            norm_path = path.replace("\\", "/").lower()
            if norm_target.startswith(norm_path) or norm_path in norm_target:
                return 1.0

        # Partial segment match
        target_segs = set(norm_target.split("/"))
        for path in allowed_paths:
            path_segs = set(path.replace("\\", "/").lower().split("/"))
            if target_segs & path_segs:
                return 0.55

        return 0.15

    def _suspicion_penalty(self, target: str, action_type: str) -> float:
        target_lc = target.lower()
        for pat in _ALWAYS_SUSPICIOUS:
            if re.search(pat, target_lc, re.IGNORECASE):
                return 0.92   # near-total penalty
        for pat in _EXTERNAL_TARGETS:
            if re.search(pat, target_lc, re.IGNORECASE):
                return 0.75
        return 0.0

    def _generate_reason(
        self,
        goal: str,
        target: str,
        score: float,
        keyword_score: float,
        path_score: float,
        suspicion_penalty: float,
    ) -> str:
        if suspicion_penalty >= 0.75:
            return (
                f"Target '{target}' is highly suspicious and unrelated to '{goal}'"
            )
        if score >= 0.75:
            return f"Action strongly aligns with goal '{goal}'"
        if path_score >= 0.9:
            return f"Target is within the allowed paths for this task"
        if keyword_score >= 0.5:
            return f"Moderate keyword alignment with goal '{goal}'"
        return f"Weak alignment with goal '{goal}' (score {int(score*100)}%)"
