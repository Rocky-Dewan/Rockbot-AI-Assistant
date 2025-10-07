import React, { useRef } from "react";
import MessageToolbar from "./message-toolbar";
import { Paperclip } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Message (enhanced)
 * props:
 *  - message: { id, role, content, timestamp, file, likes, dislikes, metadata, sending }
 *  - isOwn: boolean
 *  - onEdit, onCopy, onLike, onDislike, onDelete
 *  - showAvatar, showToolbar
 */
export default function Message({
  message,
  isOwn = false,
  onEdit,
  onCopy,
  onLike,
  onDislike,
  onDelete,
  showAvatar = true,
  showToolbar = true,
}) {
  const file = message.file;
  const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const bubbleClass = isOwn
    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
    : "bg-white/80 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 border border-gray-200/30 dark:border-gray-700/30";

  return (
    <motion.div layout className={`flex items-start gap-3 ${isOwn ? "justify-end" : "justify-start"}`}>
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gray-600 text-white flex items-center justify-center">
            A
          </div>
        </div>
      )}

      <div className={`rounded-2xl p-3 max-w-[78%] ${bubbleClass} shadow-sm relative`}>
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
          {file && (
            <div className="mt-2">
              <a href={file.url || file.localUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs underline">
                <Paperclip className="w-4 h-4" />
                {file.name || "Attachment"}
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 text-xs opacity-80">
          <div className="flex items-center gap-2">
            {message.metadata?.agent_name && <span>via {message.metadata.agent_name}</span>}
            {message.sending && <span className="italic">sending…</span>}
          </div>

          <div className="flex items-center gap-3">
            <span>{time}</span>
            {showToolbar && (
              <MessageToolbar
                onCopy={() => onCopy && onCopy(message)}
                onEdit={() => onEdit && onEdit(message)}
                onLike={() => onLike && onLike(message)}
                onDislike={() => onDislike && onDislike(message)}
                onDelete={() => onDelete && onDelete(message)}
                likes={message.likes || 0}
                dislikes={message.dislikes || 0}
              />
            )}
          </div>
        </div>
      </div>

      {showAvatar && isOwn && (
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
            U
          </div>
        </div>
      )}
    </motion.div>
  );
}
