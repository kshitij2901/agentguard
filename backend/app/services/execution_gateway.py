"""
Mock Execution Gateway
======================
Simulates action execution WITHOUT running any real OS commands.
Safe to run in demos, hackathon presentations, or CI.

Design:
  - ALLOW   → returns a realistic-looking success message
  - SANDBOX → wraps result in a sandbox notice
  - APPROVAL_REQUIRED → returns a pending-approval notice
  - BLOCK   → returns a prevention message; no execution attempted

Future drop-in replacements (same interface):
  DockerExecutionGateway  – Phase 4
  RealToolExecutionGateway / MCPExecutionGateway  – Phase 5

Implements: ExecutionGatewayInterface
"""

from typing import Optional
from app.services.interfaces import ExecutionGatewayInterface

_MOCK_RESULTS = {
    "FILE_READ": (
        "SUCCESS - File contents read (simulated).\n"
        "  Contents: [mock file data returned to agent]"
    ),
    "FILE_WRITE": (
        "SUCCESS - File written (simulated).\n"
        "  Bytes written: 1024 (mock)"
    ),
    "COMMAND_EXECUTE": (
        "SUCCESS - Command executed (simulated).\n"
        "  Exit code: 0\n"
        "  stdout: [mock command output]"
    ),
    "NETWORK_REQUEST": (
        "SUCCESS - Network request completed (simulated).\n"
        "  Status: 200 OK\n"
        "  Body: [mock response body]"
    ),
    "GIT_OPERATION": (
        "SUCCESS - Git operation completed (simulated).\n"
        "  Output: [mock git output]"
    ),
}


class MockExecutionGateway(ExecutionGatewayInterface):
    """
    Safe mock gateway.  Never touches the OS, filesystem, or network.
    """

    def execute(
        self,
        action_type: str,
        target: str,
        description: Optional[str] = None,
        decision: str = "ALLOW",
    ) -> str:
        if decision == "BLOCK":
            return (
                "=== [EXECUTION PREVENTED] ===\n"
                f"Target  : {target}\n"
                "Reason  : AgentGuard blocked this action based on security policy.\n"
                "Action  : No execution attempted."
            )

        if decision == "APPROVAL_REQUIRED":
            return (
                "=== [EXECUTION PENDING APPROVAL] ===\n"
                f"Target  : {target}\n"
                "Status  : Awaiting human approval before execution.\n"
                "Action  : Queued but not executed."
            )

        mock_result = _MOCK_RESULTS.get(action_type, "SUCCESS - Operation completed (simulated).")

        if decision == "SANDBOX":
            return (
                "=== [SANDBOX EXECUTION] ===\n"
                f"Target  : {target}\n"
                f"Result  : {mock_result}"
            )

        # ALLOW
        return (
            "=== [MOCK EXECUTION] ===\n"
            f"Target  : {target}\n"
            f"Result  : {mock_result}"
        )
