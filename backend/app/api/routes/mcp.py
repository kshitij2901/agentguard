"""
MCP HTTP Router
===============
Exposes Model Context Protocol (MCP) JSON-RPC 2.0 endpoints over HTTP.
Enables browser dashboards, CI pipelines, and external AI agents to call tools
through AgentGuard's intent verification layer.
"""

from typing import Dict, Any
from fastapi import APIRouter, Body

from app.mcp.server import MCPSecurityProxy

router = APIRouter(prefix="/api/mcp", tags=["mcp"])

# Global persistent proxy instance for HTTP testing
_proxy = MCPSecurityProxy(
    task_goal="Fix authentication bug in login handler",
    allowed_paths=["src/auth", "tests/auth"],
)


@router.get("/tools")
def list_mcp_tools():
    """Returns tools available through the AgentGuard MCP security gateway."""
    return {"tools": _proxy.get_tool_definitions()}


@router.post("/rpc")
def handle_mcp_rpc(payload: Dict[str, Any] = Body(...)):
    """
    Standard JSON-RPC 2.0 endpoint for MCP protocol clients.
    Supports initialize, tools/list, tools/call, ping.
    """
    return _proxy.handle_rpc_payload(payload)


@router.post("/call")
def call_mcp_tool_direct(
    tool_name: str = Body(..., embed=True),
    arguments: Dict[str, Any] = Body(default_factory=dict, embed=True),
):
    """Convenience endpoint to execute an MCP tool directly without raw JSON-RPC wrapping."""
    return _proxy.handle_call_tool(tool_name, arguments)
