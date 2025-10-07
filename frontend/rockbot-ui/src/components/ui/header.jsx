import React from 'react';
import ThemeToggle from './theme-toggle';
import { Button } from './button';
import { Download, Share2 } from 'lucide-react';

export default function ChatHeader({
  currentConversation,
  agents,
  selectedAgent,
  setSelectedAgent,
  onExport,
  onShare
}) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold">Rockbot</h1>
          {currentConversation ? <div className="text-xs opacity-70">{currentConversation.title}</div> : <div className="text-xs opacity-60">No conversation selected</div>}
        </div>

        <div>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="rounded-lg border border-gray-200 p-2 bg-white/90"
          >
            {Object.entries(agents).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentConversation && (
          <>
            <Button variant="ghost" onClick={onShare}><Share2 className="w-4 h-4 mr-1" />Share</Button>
            <Button variant="ghost" onClick={onExport}><Download className="w-4 h-4 mr-1" />Export</Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
