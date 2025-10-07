import React from "react";

export function Input({ className = "", icon, ...props }) {
  return (
    <div
      className={`flex items-center bg-white/5 dark:bg-gray-800/40 rounded-xl border border-gray-300/20 
      focus-within:ring-2 focus-within:ring-blue-500/60 transition-all px-3 py-2 backdrop-blur-md ${className}`}
    >
      {icon && <span className="text-gray-400 mr-2">{icon}</span>}
      <input
        className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400"
        {...props}
      />
    </div>
  );
}
