import React from "react";

/**
 * TypingIndicator
 * - Small three-dot typing indicator with agent name
 */
export default function TypingIndicator({ agentName = "Assistant" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gray-600 text-white flex items-center justify-center">A</div>
      <div className="bg-white/80 dark:bg-gray-800/70 rounded-lg p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.12s" }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.24s" }} />
          </div>
          <div className="text-xs opacity-80">Typing — {agentName}</div>
        </div>
      </div>
    </div>
  );
}
