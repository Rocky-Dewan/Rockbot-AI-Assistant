import React from "react";

export function ScrollArea({ children, className = "" }) {
  return (
    <div
      className={`overflow-y-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-blue-500/40 
      scrollbar-track-transparent hover:scrollbar-thumb-blue-500/70 rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}
