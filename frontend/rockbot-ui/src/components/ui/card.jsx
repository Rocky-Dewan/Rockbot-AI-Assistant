import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl 
      p-5 transition-all hover:shadow-2xl hover:scale-[1.01] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="mb-4 border-b border-white/10 pb-2">{children}</div>;
}

export function CardTitle({ children }) {
  return (
    <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
      {children}
    </h2>
  );
}

export function CardContent({ children }) {
  return <div className="space-y-3">{children}</div>;
}
