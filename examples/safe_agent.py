"""
Safe Agent Simulator Example
============================
Demonstrates how an autonomous coding agent interacts with AgentGuard
during a legitimate development task (e.g., fixing an authentication bug).

All actions are evaluated through AgentGuard and allowed according to policy.
"""

import sys
import time
import httpx

BASE_URL = "http://localhost:8000"


def run_safe_agent():
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    print("=" * 60)
    print(" AgentGuard - Safe Coding Agent Simulation")
    print("=" * 60)

    # 1. Create a task with clear intent & security boundaries
    print("\n[1/3] Defining user intent & task boundaries...")
    task_payload = {
        "goal": "Fix authentication bug",
        "allowed_paths": ["src/auth", "tests/auth"],
        "sensitive_access_allowed": False,
        "network_access_allowed": False,
        "destructive_actions_allowed": False,
        "git_push_allowed": False,
    }
    task_res = client.post("/api/tasks/", json=task_payload)
    if task_res.status_code != 201:
        print(f"Failed to create task: {task_res.text}")
        return

    task = task_res.json()
    task_id = task["id"]
    print(f"[OK] Task Created: ID={task_id}")
    print(f"  Goal: '{task['goal']}'")
    print(f"  Allowed Paths: {task['allowed_paths']}")

    # 2. Agent proposes and executes safe development actions
    actions_to_perform = [
        {
            "task_id": task_id,
            "type": "FILE_READ",
            "target": "src/auth/login.py",
            "description": "Read authentication implementation to diagnose the login failure",
        },
        {
            "task_id": task_id,
            "type": "FILE_READ",
            "target": "tests/auth/test_login.py",
            "description": "Inspect existing unit tests for auth module",
        },
        {
            "task_id": task_id,
            "type": "FILE_WRITE",
            "target": "src/auth/login.py",
            "description": "Patch null reference check in user authentication token validator",
        },
        {
            "task_id": task_id,
            "type": "COMMAND_EXECUTE",
            "target": "pytest tests/auth/ -v",
            "description": "Run authentication test suite to verify the fix",
        },
    ]

    print("\n[2/3] Agent executing workflow through AgentGuard...")
    for idx, act in enumerate(actions_to_perform, 1):
        print(f"\n--- Action {idx}: {act['type']} -> {act['target']} ---")
        eval_res = client.post("/api/actions/execute", json=act)
        if eval_res.status_code != 200:
            print(f"  Error: {eval_res.text}")
            continue

        data = eval_res.json()
        intent = data["intent_result"]
        risk = data["risk_result"]
        dec = data["decision_result"]
        exec_res = data["execution_result"]

        print(f"  Intent Alignment : {intent['score_percent']}%")
        print(f"  Risk Score       : {risk['risk_score']} ({risk['risk_level']})")
        print(f"  Decision         : {dec['decision']}")
        print(f"  Reason           : {dec['reason']}")
        print(f"  Gateway Output   :\n    " + exec_res.replace("\n", "\n    "))
        time.sleep(0.5)

    # 3. Retrieve final stats
    print("\n[3/3] Fetching summary metrics from AgentGuard...")
    stats_res = client.get("/api/stats")
    if stats_res.status_code == 200:
        stats = stats_res.json()
        print("[OK] System Stats:")
        print(f"  Total Actions: {stats['total_actions']}")
        print(f"  Allowed: {stats['allowed']} | Sandboxed: {stats['sandboxed']} | Blocked: {stats['blocked']}")
        print(f"  Average Risk: {stats['average_risk']}")
    print("\n[OK] Safe Agent Simulation Finished Successfully.")


if __name__ == "__main__":
    try:
        run_safe_agent()
    except Exception as e:
        print(f"Error running safe agent simulation: {e}")
        print("Ensure AgentGuard backend is running (uvicorn app.main:app --reload)")
