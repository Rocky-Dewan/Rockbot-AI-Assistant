import React from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  icon,
  loading = false,
  ...props
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all focus:outline-none active:scale-[0.97]";
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700",
    secondary:
      "bg-white/10 text-white border border-white/20 backdrop-blur-md hover:bg-white/20",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/50",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && (
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"></span>
      )}
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
