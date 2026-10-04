"""Tests for MCP Security Proxy."""
import json
import pytest
from app.mcp.server import MCPSecurityProxy


@pytest.fixture
def mcp_proxy():
    return MCPSecurityProxy(
        task_goal="Fix authentication bug in login handler",
        allowed_paths=["src/auth", "tests/auth"],
    )


def test_mcp_initialize(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {},
    }
    resp = mcp_proxy.handle_rpc_payload(req)
    assert resp["jsonrpc"] == "2.0"
    assert resp["id"] == 1
    assert "capabilities" in resp["result"]
    assert "AgentGuard" in resp["result"]["serverInfo"]["name"]


def test_mcp_tools_list(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {},
    }
    resp = mcp_proxy.handle_rpc_payload(req)
    tool_names = [t["name"] for t in resp["result"]["tools"]]
    assert "read_file" in tool_names
    assert "write_file" in tool_names
    assert "execute_command" in tool_names


def test_mcp_call_allowed_tool(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"path": "src/auth/login.py"},
        },
    }
    resp = mcp_proxy.handle_rpc_payload(req)
    assert resp["result"]["isError"] is False
    assert "ALLOWED" in resp["result"]["content"][0]["text"]


def test_mcp_call_blocked_tool(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 4,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"path": "~/.aws/credentials"},
        },
    }
    resp = mcp_proxy.handle_rpc_payload(req)
    assert resp["result"]["isError"] is True
    assert "PROHIBITED" in resp["result"]["content"][0]["text"]
