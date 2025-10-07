import React from 'react';
import Avatar from './avatar';
import { Button } from './button';
import { Card } from './card';

/**
 * Sidebar component — receives conversations and handlers
 */
export default function Sidebar({
  conversations = [],
  currentConversation,
  onSelectConversation = () => { },
  onNewConversation = () => { }
}) {
  return (
    <aside className="w-80 bg-white/80 dark:bg-gray-900/70 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar name="Rockbot" size="md" online />
          <div>
            <h3 className="text-lg font-semibold">Rockbot</h3>
            <p className="text-xs opacity-70">Your assistant</p>
          </div>
        </div>
        <Button onClick={onNewConversation}>New</Button>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <Card className="p-4 text-sm opacity-80">No conversations yet — click New</Card>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-xl transition ${currentConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm truncate">{conv.title}</div>
                    <div className="text-xs opacity-70 mt-1">{new Date(conv.updated_at).toLocaleString()}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
