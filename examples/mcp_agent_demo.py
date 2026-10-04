"""
AgentGuard MCP Client Demonstration
===================================
Demonstrates an AI agent calling tools through the AgentGuard MCP Proxy.
Shows both an allowed operation and an intercepted malicious tool invocation.
"""

import json
from app.mcp.server import MCPSecurityProxy


def main():
    print("=" * 65)
    print("   AgentGuard MCP Security Proxy — Live Agent Demonstration")
    print("=" * 65)

    proxy = MCPSecurityProxy(
        task_goal="Fix authentication bug in login handler",
        allowed_paths=["src/auth", "tests/auth"],
    )

    print("\n1. Tool Discovery (`tools/list`):")
    tools_resp = proxy.handle_rpc_payload({"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}})
    for t in tools_resp["result"]["tools"]:
        print(f"  • {t['name']:<18} - {t['description']}")

    print("\n2. Agent Action 1: Reading legitimate source file (`tools/call`):")
    res1 = proxy.handle_rpc_payload({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"path": "src/auth/login.py"},
        },
    })
    print(res1["result"]["content"][0]["text"])

    print("\n3. Agent Action 2: Attack Injection attempting to read credentials (`tools/call`):")
    res2 = proxy.handle_rpc_payload({
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"path": "~/.aws/credentials"},
        },
    })
    print(res2["result"]["content"][0]["text"])

    print("\n4. Agent Action 3: Supply chain slopsquatting attack (`tools/call`):")
    res3 = proxy.handle_rpc_payload({
        "jsonrpc": "2.0",
        "id": 4,
        "method": "tools/call",
        "params": {
            "name": "execute_command",
            "arguments": {"command": "pip install reqeusts"},
        },
    })
    print(res3["result"]["content"][0]["text"])

    print("\n" + "=" * 65)
    print("   Demonstration Completed: All Malicious Actions Neutralized")
    print("=" * 65)


if __name__ == "__main__":
    main()
