import React from 'react';
import { Button } from './button';

/**
 * Re-usable empty state for center panels
 */
export default function EmptyState({ title = 'Start a conversation', subtitle = 'Click New Conversation to begin', onCreate = null }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-200 to-purple-200/40 flex items-center justify-center mb-4">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M12 3v6" stroke="#4c51bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm opacity-80 mb-4">{subtitle}</p>
      {onCreate && <Button onClick={onCreate}>Create Conversation</Button>}
    </div>
  );
}
