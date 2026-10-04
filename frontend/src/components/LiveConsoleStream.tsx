import React, { useEffect, useState, useRef } from 'react';

interface ConsoleLine {
  id: string;
  type: 'info' | 'warn' | 'error' | 'success' | 'cmd';
  text: string;
  timestamp: string;
}

interface Props {
  lines: ConsoleLine[];
  isStreaming: boolean;
  onClear?: () => void;
}

export const LiveConsoleStream: React.FC<Props> = ({ lines, isStreaming, onClear }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="bg-black border border-zinc-800 font-mono shadow-xl relative overflow-hidden">
      {/* Console Top Bar */}
      <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
          <span className="text-zinc-400 font-bold ml-1">
            stdout::agentguard-proxy.log
          </span>
          {isStreaming && (
            <span className="px-1.5 py-0.2 bg-zinc-800 text-white border border-zinc-600 text-[10px] animate-pulse">
              STREAMING
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onClear && lines.length > 0 && (
            <button
              onClick={onClear}
              className="text-[10px] text-zinc-500 hover:text-white px-2 py-0.5 border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              $ clear
            </button>
          )}
          <span className="text-[10px] text-zinc-600">PIPE: /dev/stdout</span>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={containerRef}
        className="p-4 max-h-[220px] min-h-[140px] overflow-y-auto space-y-1 text-xs select-text"
      >
        {lines.length === 0 ? (
          <div className="text-zinc-600 text-xs py-4 flex items-center gap-2">
            <span>&gt; Proxy listening on 127.0.0.1:8000 (MCP stdio bridge ready). Run a simulation or type a command above...</span>
            <span className="terminal-cursor" />
          </div>
        ) : (
          lines.map((l) => (
            <div key={l.id} className="flex items-start gap-2 leading-relaxed animate-fade-in">
              <span className="text-zinc-600 select-none text-[10px] shrink-0 pt-0.5">
                {l.timestamp}
              </span>
              <div
                className={`font-mono break-all ${
                  l.type === 'cmd'
                    ? 'text-white font-bold'
                    : l.type === 'error'
                    ? 'text-white bg-zinc-900 border-l-2 border-white pl-2'
                    : l.type === 'success'
                    ? 'text-zinc-100 font-semibold'
                    : l.type === 'warn'
                    ? 'text-zinc-300'
                    : 'text-zinc-400'
                }`}
              >
                {l.text}
              </div>
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs pt-1">
            <span className="animate-spin">[⧖]</span>
            <span>evaluating security vector...</span>
            <span className="terminal-cursor" />
          </div>
        )}
      </div>
    </div>
  );
};
