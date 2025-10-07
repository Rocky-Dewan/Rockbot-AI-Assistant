import React from "react";

export function Select({ value, onChange, children, className = "" }) {
  return (
    <div
      className={`relative bg-white/10 dark:bg-gray-900/40 border border-white/20 backdrop-blur-md rounded-xl 
      hover:border-blue-400 transition-all shadow-md ${className}`}
    >
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-transparent text-gray-900 dark:text-gray-100 py-2.5 px-4 rounded-xl outline-none cursor-pointer"
      >
        {children}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        ▼
      </span>
    </div>
  );
}

export function SelectItem({ children, ...props }) {
  return (
    <option className="bg-gray-800 text-white hover:bg-blue-600" {...props}>
      {children}
    </option>
  );
}
