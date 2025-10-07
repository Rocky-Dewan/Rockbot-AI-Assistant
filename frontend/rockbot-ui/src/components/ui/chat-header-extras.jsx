import React from "react";
import { Sun, Moon, Download, Share2 } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";

/**
 * ChatHeaderExtras
 * - Shows agent avatar/name, capabilities badges, theme toggle and quick export/share buttons.
 */
export default function ChatHeaderExtras({
  agent = null,
  onExport,
  onShare,
  theme = "light",
  setTheme = () => { },
}) {
  return (
    <div className="flex items-center gap-3">
      {agent ? (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            {agent.name?.slice(0, 1) || "A"}
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-medium">{agent.name || "Assistant"}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {agent.description || ""}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={onShare}
          title="Share conversation"
          className="p-2 rounded hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={onExport}
          title="Export conversation (PDF)"
          className="p-2 rounded hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
        >
          <Download className="w-4 h-4" />
        </button>

        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
}
