"""
AgentGuard MCP Security Proxy Server
=====================================
Implements the Model Context Protocol (MCP) JSON-RPC 2.0 interface.
Sits as an active security gateway between AI agents (Claude Code, Cursor, Cline)
and the host environment's tools.

Supported Transports:
  1. Stdio (Standard I/O JSON-RPC 2.0 lines)
  2. Direct Python / API invocation via `handle_rpc_payload()`

Usage:
  # Run as stdio server for Claude Desktop / Cursor
  python -m app.mcp.server --task-goal "Fix authentication bug" --allowed-paths "src/auth,tests"
"""

import sys
import json
import logging
from typing import Dict, Any, Optional, List

from sqlalchemy.orm import Session

from app.database.database import SessionLocal, init_db
from app.api.deps import (
    get_rule_engine,
    get_intent_engine,
    get_risk_engine,
    get_policy_engine,
    get_execution_gateway,
    get_intent_manager,
    get_audit_service,
)
from app.services.action_interceptor import ActionInterceptor

logger = logging.getLogger("agentguard.mcp")


class MCPSecurityProxy:
    """
    Translates MCP tool calls into AgentGuard actions, evaluates them against
    user-defined intent, and enforces runtime security boundaries.
    """

    def __init__(self, task_goal: str = "General software development", allowed_paths: Optional[List[str]] = None) -> None:
        self.task_goal = task_goal
        self.allowed_paths = allowed_paths or ["src", "tests", "docs"]
        self.task_id: Optional[str] = None
        self._init_backend()

    def _init_backend(self) -> None:
        init_db()
        self.rule_engine = get_rule_engine()
        self.intent_engine = get_intent_engine()
        self.risk_engine = get_risk_engine()
        self.policy_engine = get_policy_engine()
        self.execution_gateway = get_execution_gateway()
        self.intent_manager = get_intent_manager()
        self.audit_service = get_audit_service()

        self.interceptor = ActionInterceptor(
            rule_engine=self.rule_engine,
            intent_engine=self.intent_engine,
            risk_engine=self.risk_engine,
            policy_engine=self.policy_engine,
            execution_gateway=self.execution_gateway,
            intent_manager=self.intent_manager,
            audit_service=self.audit_service,
        )

        # Create session and default active task
        db: Session = SessionLocal()
        try:
            task = self.intent_manager.create_task(
                db=db,
                goal=self.task_goal,
                allowed_paths=self.allowed_paths,
            )
            self.task_id = task.id
        finally:
            db.close()

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "read_file",
                "description": "Read file contents at the specified filesystem path.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Absolute or relative file path to read"}
                    },
                    "required": ["path"],
                },
            },
            {
                "name": "write_file",
                "description": "Write or overwrite contents of a file at the specified filesystem path.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Target file path"},
                        "content": {"type": "string", "description": "Contents to write"}
                    },
                    "required": ["path", "content"],
                },
            },
            {
                "name": "execute_command",
                "description": "Execute a shell command in the workspace terminal environment.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "command": {"type": "string", "description": "The command string to execute"}
                    },
                    "required": ["command"],
                },
            },
            {
                "name": "network_request",
                "description": "Perform an HTTP network request to an external service or URL.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "Target URL"},
                        "method": {"type": "string", "default": "GET"},
                        "body": {"type": "string", "description": "Optional payload"}
                    },
                    "required": ["url"],
                },
            },
            {
                "name": "git_operation",
                "description": "Execute a Git command on the local workspace repository.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "command": {"type": "string", "description": "Git subcommand e.g. git status, git commit"}
                    },
                    "required": ["command"],
                },
            },
        ]

    def handle_call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Intercepts tool call, evaluates intent and blast radius, and returns standard MCP response.
        """
        # Map MCP tool to AgentGuard action
        if tool_name == "read_file":
            action_type = "FILE_READ"
            target = arguments.get("path", "")
            desc = f"MCP tool read_file at '{target}'"
        elif tool_name == "write_file":
            action_type = "FILE_WRITE"
            target = arguments.get("path", "")
            desc = f"MCP tool write_file at '{target}'"
        elif tool_name == "execute_command":
            action_type = "COMMAND_EXECUTE"
            target = arguments.get("command", "")
            desc = f"MCP tool execute_command '{target}'"
        elif tool_name == "network_request":
            action_type = "NETWORK_REQUEST"
            target = arguments.get("url", "")
            desc = f"MCP tool network_request to '{target}'"
        elif tool_name == "git_operation":
            action_type = "GIT_OPERATION"
            target = arguments.get("command", "")
            desc = f"MCP tool git_operation '{target}'"
        else:
            return {
                "isError": True,
                "content": [{"type": "text", "text": f"AgentGuard Error: Unsupported MCP tool '{tool_name}'"}],
            }

        db: Session = SessionLocal()
        try:
            res = self.interceptor.intercept(
                db=db,
                task_id=self.task_id,
                action_type=action_type,
                target=target,
                description=desc,
                execute=True,
            )
        finally:
            db.close()

        decision = res.get("decision_result", {}).get("decision", "BLOCK")
        reason = res.get("decision_result", {}).get("reason", "")
        risk_score = res.get("risk_result", {}).get("risk_score", 100)
        rule_id = res.get("rule_result", {}).get("rule_id") or "INTENT_MISALIGNMENT"
        exec_out = res.get("execution_result") or "Action evaluated safely"

        if decision == "ALLOW":
            return {
                "isError": False,
                "content": [
                    {
                        "type": "text",
                        "text": f"[AGENTGUARD: ALLOWED | Risk: {risk_score}/100]\n{exec_out}",
                    }
                ],
                "_agentguard": res,
            }
        elif decision == "SANDBOX":
            return {
                "isError": False,
                "content": [
                    {
                        "type": "text",
                        "text": f"[AGENTGUARD: SANDBOX CONTAINER DISPATCH | Risk: {risk_score}/100]\nExecuted in isolated sandbox. Output: {exec_out}",
                    }
                ],
                "_agentguard": res,
            }
        elif decision == "APPROVAL_REQUIRED":
            return {
                "isError": True,
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"[AGENTGUARD: APPROVAL REQUIRED | Risk: {risk_score}/100]\n"
                            f"Action '{target}' requires human confirmation. Reason: {reason}"
                        ),
                    }
                ],
                "_agentguard": res,
            }
        else:  # BLOCK
            return {
                "isError": True,
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"[AGENTGUARD: PROHIBITED BY SECURITY POLICY]\n"
                            f"Decision: BLOCK\n"
                            f"Target: {target}\n"
                            f"Risk Score: {risk_score}/100\n"
                            f"Rule ID: {rule_id}\n"
                            f"Policy Violation: {reason}"
                        ),
                    }
                ],
                "_agentguard": res,
            }

    def handle_rpc_payload(self, req: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatches standard MCP JSON-RPC 2.0 requests.
        """
        msg_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": False},
                        "resources": {},
                        "prompts": {},
                    },
                    "serverInfo": {
                        "name": "AgentGuard-MCP-Security-Proxy",
                        "version": "1.0.0",
                        "description": "Intent-Bound Authorization and Security Gateway for AI Coding Agents",
                    },
                },
            }

        elif method in ("notifications/initialized", "initialized"):
            return {"jsonrpc": "2.0", "id": msg_id, "result": {}}

        elif method == "ping":
            return {"jsonrpc": "2.0", "id": msg_id, "result": {}}

        elif method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"tools": self.get_tool_definitions()},
            }

        elif method == "tools/call":
            tool_name = params.get("name")
            arguments = params.get("arguments", {})
            call_res = self.handle_call_tool(tool_name, arguments)
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": call_res,
            }

        else:
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {
                    "code": -32601,
                    "message": f"Method '{method}' not found",
                },
            }


def run_stdio_server(task_goal: str = "General software development", allowed_paths: Optional[List[str]] = None) -> None:
    proxy = MCPSecurityProxy(task_goal=task_goal, allowed_paths=allowed_paths)
    logger.info(f"AgentGuard MCP Stdio Proxy started for task: '{task_goal}'")

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = proxy.handle_rpc_payload(req)
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error or exception: {str(e)}"},
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="AgentGuard MCP Security Proxy Server")
    parser.add_argument("--task-goal", type=str, default="Fix authentication bug in login handler", help="User intent task goal")
    parser.add_argument("--allowed-paths", type=str, default="src/auth,tests", help="Comma-separated allowed paths")
    args = parser.parse_args()

    paths = [p.strip() for p in args.allowed_paths.split(",") if p.strip()]
    run_stdio_server(task_goal=args.task_goal, allowed_paths=paths)
