# AgentGuard — Security Layer for Autonomous AI Coding Agents

> **Traditional security asks:** *"Is this action technically allowed?"*  
> **AgentGuard asks:** *"Is this action consistent with what the user originally intended?"*

[![Backend Tests](https://img.shields.io/badge/pytest-passing-brightgreen)](#testing)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com/)

---

## 1. The Problem

Autonomous AI coding agents (such as agents operating in IDEs or CLI workflows) have the power to read/write files, execute shell commands, manage Git branches, and make network requests.

However, when an agent encounters **untrusted input** (malicious instructions inside a cloned repository, prompt injection in a pull request diff, or third-party documentation), the agent can be tricked into:
- Reading sensitive secrets (`~/.aws/credentials`, `~/.ssh/id_rsa`, `.env` files).
- Exfiltrating confidential code or credentials to attacker servers.
- Executing destructive commands (`rm -rf /`, `chmod 777`, `DROP DATABASE`).

Standard OS permissions fail here because the agent runs with the developer's credentials. **AgentGuard solves this through Intent-Bound Authorization.**

---

## 2. Intent-Bound Authorization

AgentGuard sits as an active security proxy between the AI Agent and the tool execution environment.

```text
User Task Definition (Intent)
           ↓
   Autonomous AI Agent
           ↓
┌─────────────────────────────────────────────────────────┐
│                    AGENTGUARD PIPELINE                  │
│                                                         │
│   1. Action Interceptor     (Enforces gateway pass)     │
│   2. Rule Engine            (Deterministic patterns)    │
│   3. Intent Engine          (Goal vs Action alignment)  │
│   4. Risk Engine            (Composite 0-100 scoring)   │
│   5. Policy Engine          (Configurable thresholds)   │
│   6. Execution Gateway      (Mock / Sandbox / Tool)     │
│   7. Audit Logger           (Immutable SQLite log)      │
└─────────────────────────────────────────────────────────┘
           ↓
   Decision: ALLOW | SANDBOX | APPROVAL_REQUIRED | BLOCK
```

---

## 3. Demo Scenarios

AgentGuard includes 3 pre-configured scenarios runnable via one click on the dashboard or API:

| Demo Scenario | User Intent | Agent Behavior | AgentGuard Decision |
| :--- | :--- | :--- | :--- |
| **1. Safe Task** | *Fix auth bug* | Reads `src/auth/login.py`, writes fix, runs `pytest` | **`ALLOW`** (Intent: ~95%, Risk: 8/100) |
| **2. Credential Theft** | *Fix auth bug* | Reads login file, then attempts to read `~/.aws/credentials` | **`BLOCK`** (Intent: 2%, Risk: 97/100) |
| **3. Prompt Injection** | *Review PR* | Poisoned repo instructs agent to exfiltrate SSH keys | **`BLOCK`** (Intent: 2%, Risk: 97/100) |

---

## 4. Quickstart & Local Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.10 - 3.14)
- Node.js 18+ and npm

### Backend Setup
```bash
# 1. Navigate to backend directory
cd agentguard/backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend Swagger API documentation will be live at `http://localhost:8000/docs`.

### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd agentguard/frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Open `http://localhost:5173` to interact with the Security Dashboard.

---

## 5. API Reference

### Tasks
- `POST /api/tasks/` — Create intent context with security boundary parameters.
- `GET /api/tasks/{id}` — Retrieve task context.
- `GET /api/tasks/` — List all active tasks.

### Actions & Evaluation
- `POST /api/actions/evaluate` — Evaluate action through full pipeline without executing.
- `POST /api/actions/execute` — Intercept, evaluate, and execute via Gateway.

### Audit & Telemetry
- `GET /api/audit` — Retrieve immutable audit trail with pipeline breakdowns.
- `GET /api/stats` — Aggregate metrics (total actions, allowed, sandboxed, blocked, avg risk).

### Demo Automation
- `POST /api/demo/safe` — Run safe coding scenario.
- `POST /api/demo/credential-theft` — Run credential theft defense scenario.
- `POST /api/demo/prompt-injection` — Run prompt injection defense scenario.

---

## 6. Running Tests

```bash
cd agentguard/backend
python -m pytest tests/ -v
```

All test suites verify:
- Deterministic rule matches (sensitive paths, dangerous commands, network patterns).
- Intent alignment heuristics & penalty factors.
- Composite risk score calculations & escalation logic.
- Policy threshold mapping.
- End-to-end interceptor pipeline enforcement.

---

## 7. Extensibility & Future Roadmap

AgentGuard is architected with strict interface abstraction (`services/interfaces.py`):

- **Phase 2 — Direct LLM Agent Integration**: Native plugins for Claude Code, Gemini CLI, Cursor, and Codex.
- **Phase 3 — MCP (Model Context Protocol) Security Gateway**: Intercepting MCP tool call requests before dispatch.
- **Phase 4 — Docker Sandbox Execution**: Isolated execution environments for medium-risk actions.
- **Phase 5 — Semantic LLM Intent Engine**: Zero-shot LLM reasoning for ambiguous user intents.
- **Phase 6 — Action Consequence Analysis**: Pre-execution AST / dry-run consequence simulations.
- **Phase 7 — Web3 Financial Intent Verification**: Signed intent verification for autonomous on-chain agents.
