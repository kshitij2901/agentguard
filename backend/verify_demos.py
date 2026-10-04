from fastapi.testclient import TestClient
from app.main import app
from app.database.database import init_db

init_db()
client = TestClient(app)

print("--- 1. Health Check ---")
r = client.get("/health")
print("Status:", r.status_code, r.json())
assert r.status_code == 200

print("\n--- 2. DEMO 1: Safe Coding Scenario ---")
r = client.post("/api/demo/safe")
print("Status:", r.status_code)
data = r.json()
print("Goal:", data["goal"])
for act in data["results"]:
    print(f"  Target: {act['action_target']:<35} Decision: {act['decision']:<6} (Risk: {act['risk_score']:<2}, Intent: {act['intent_score']}%)")
    assert act["decision"] == "ALLOW"

print("\n--- 3. DEMO 2: Credential Theft Scenario ---")
r = client.post("/api/demo/credential-theft")
print("Status:", r.status_code)
data = r.json()
print("Goal:", data["goal"])
for act in data["results"]:
    print(f"  Target: {act['action_target']:<35} Decision: {act['decision']:<6} (Risk: {act['risk_score']:<2}, Intent: {act['intent_score']}%)")
assert data["results"][0]["decision"] == "ALLOW"
assert data["results"][1]["decision"] == "BLOCK"
assert data["results"][2]["decision"] == "BLOCK"

print("\n--- 4. DEMO 3: Prompt Injection Scenario ---")
r = client.post("/api/demo/prompt-injection")
print("Status:", r.status_code)
data = r.json()
print("Goal:", data["goal"])
for act in data["results"]:
    print(f"  Target: {act['action_target']:<35} Decision: {act['decision']:<6} (Risk: {act['risk_score']:<2}, Intent: {act['intent_score']}%)")
assert data["results"][0]["decision"] == "ALLOW"
assert data["results"][1]["decision"] == "BLOCK"
assert data["results"][2]["decision"] == "BLOCK"

print("\n--- 5. DEMO 4: Typosquatted Dependency (Slopsquatting) ---")
r = client.post("/api/demo/slopsquatting")
print("Status:", r.status_code)
data = r.json()
print("Goal:", data["goal"])
for act in data["results"]:
    print(f"  Target: {act['action_target']:<35} Decision: {act['decision']:<6} (Risk: {act['risk_score']:<2}, Intent: {act['intent_score']}%)")
assert data["results"][0]["decision"] == "ALLOW"
assert data["results"][1]["decision"] == "BLOCK"

print("\n--- 6. DEMO 5: Scope Creep & Catastrophic Blast Radius ---")
r = client.post("/api/demo/scope-creep")
print("Status:", r.status_code)
data = r.json()
print("Goal:", data["goal"])
for act in data["results"]:
    print(f"  Target: {act['action_target']:<35} Decision: {act['decision']:<6} (Risk: {act['risk_score']:<2}, Intent: {act['intent_score']}%)")
assert data["results"][0]["decision"] in ("ALLOW", "APPROVAL_REQUIRED")
assert data["results"][1]["decision"] == "BLOCK"
assert data["results"][2]["decision"] == "BLOCK"

print("\n--- 7. Web3 Proof-of-Action Cryptographic Chain Verification ---")
r = client.get("/api/audit/verify-chain")
print("Status:", r.status_code)
chain_data = r.json()
print("Chain Integrity:", chain_data["chain_status"], f"({chain_data['total_blocks']} blocks chained)")
print("Merkle Root:", chain_data["merkle_root"])
print("Simulated EVM Anchor TX:", chain_data["latest_anchor_tx"])
assert chain_data["is_valid"] is True
assert chain_data["total_blocks"] > 0

print("\n--- 8. MCP (Model Context Protocol) Security Gateway ---")
r = client.post(
    "/api/mcp/rpc",
    json={
        "jsonrpc": "2.0",
        "id": 101,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"path": "~/.aws/credentials"},
        },
    },
)
mcp_res = r.json()
print("MCP Tool Call Intercept Result:", mcp_res["result"]["content"][0]["text"].splitlines()[0])
assert mcp_res["result"]["isError"] is True

print("\n--- 9. System Stats ---")
r = client.get("/api/stats")
print("Stats:", r.json())

print("\n--- 10. Audit Logs ---")
r = client.get("/api/audit?limit=5")
logs = r.json()
print(f"Retrieved {len(logs)} audit log entries.")
print(f"Latest entry: {logs[0]['action_target']} -> {logs[0]['decision']} (Risk: {logs[0]['risk_score']}, Reason: {logs[0]['reason']})")
print(f"Entry SHA-256 Hash: {logs[0]['entry_hash']}")

print("\n>>> ALL 5 DEMO ATTACK VECTORS, WEB3 CHAIN, AND MCP PROTOCOL VERIFIED SUCCESSFULLY <<<")
