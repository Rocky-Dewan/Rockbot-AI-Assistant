import React from "react";

export function Badge({ children, color = "blue", className = "" }) {
  const colorMap = {
    blue: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    green: "bg-green-500/20 text-green-600 border-green-500/30",
    red: "bg-red-500/20 text-red-600 border-red-500/30",
    purple: "bg-purple-500/20 text-purple-600 border-purple-500/30",
    gray: "bg-gray-500/20 text-gray-700 border-gray-400/30",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1.5 border rounded-full text-xs font-medium 
      backdrop-blur-md transition-all hover:scale-[1.05] shadow-sm ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  );
}
