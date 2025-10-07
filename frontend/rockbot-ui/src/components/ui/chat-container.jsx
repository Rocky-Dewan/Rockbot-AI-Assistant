import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ChatContainer
 * - Wraps message list for smooth appear/leave animations
 * - Props: children (message nodes) className
 */
export default function ChatContainer({ children, className = "" }) {
  return (
    <div className={`w-full ${className}`} role="list">
      <AnimatePresence initial={false}>
        {React.Children.map(children, (child) =>
          child ? (
            <motion.div
              key={child.key || Math.random()}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="w-full"
            >
              {child}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}
