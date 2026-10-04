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

print("\n--- 5. System Stats ---")
r = client.get("/api/stats")
print("Stats:", r.json())

print("\n--- 6. Audit Logs ---")
r = client.get("/api/audit?limit=5")
logs = r.json()
print(f"Retrieved {len(logs)} audit log entries.")
print(f"Latest entry: {logs[0]['action_target']} -> {logs[0]['decision']} (Risk: {logs[0]['risk_score']}, Reason: {logs[0]['reason']})")

print("\n>>> ALL DEMO FLOWS AND APIS VERIFIED SUCCESSFULLY <<<")
