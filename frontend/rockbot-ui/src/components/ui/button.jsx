// frontend/rockbot-ui/src/components/ui/button.jsx

import React, { forwardRef } from "react";
import clsx from "clsx";

/**
 * Universal Button component with size, variant, and loading states.
 * Supports icons, accessibility labels, and keyboard focus styling.
 */
export const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      loading = false,
      disabled = false,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const base =
      "relative inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none rounded-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none";

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const variants = {
      primary:
        "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700",
      secondary:
        "bg-white/10 text-white border border-white/20 backdrop-blur-md hover:bg-white/20",
      ghost:
        "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/50",
      danger:
        "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md hover:from-red-600 hover:to-pink-700",
      success:
        "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:from-green-600 hover:to-emerald-700",
      outline:
        "border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={clsx(base, sizes[size], variants[variant], className)}
        aria-busy={loading}
        disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <span
            className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white"
            aria-hidden="true"
          ></span>
        )}
        {icon && !loading && <span className="text-lg">{icon}</span>}
        {!loading && <span>{children}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
