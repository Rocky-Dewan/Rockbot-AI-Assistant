import React from "react";
import { Copy, Edit, ThumbsUp, ThumbsDown, Trash } from "lucide-react";

/**
 * MessageToolbar
 * - Small toolbar to appear with each message (copy/edit/like/dislike/delete)
 * - All handlers optional
 */
export default function MessageToolbar({
  onCopy,
  onEdit,
  onLike,
  onDislike,
  onDelete,
  likes = 0,
  dislikes = 0,
  className = "",
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 bg-white/10 dark:bg-black/20 rounded-md p-1 shadow-sm ${className}`}
      role="toolbar"
      aria-label="Message actions"
    >
      <button
        onClick={onCopy}
        title="Copy"
        aria-label="Copy message"
        className="p-1 rounded hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
      >
        <Copy className="w-4 h-4" />
      </button>

      {onEdit && (
        <button
          onClick={onEdit}
          title="Edit"
          aria-label="Edit message"
          className="p-1 rounded hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={onLike}
        title="Like"
        aria-label="Like message"
        className="p-1 rounded hover:bg-gray-100/40 dark:hover:bg-gray-800/40 flex items-center gap-1"
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-xs">{likes}</span>
      </button>

      <button
        onClick={onDislike}
        title="Dislike"
        aria-label="Dislike message"
        className="p-1 rounded hover:bg-gray-100/40 dark:hover:bg-gray-800/40 flex items-center gap-1"
      >
        <ThumbsDown className="w-4 h-4" />
        <span className="text-xs">{dislikes}</span>
      </button>

      {onDelete && (
        <button
          onClick={onDelete}
          title="Delete"
          aria-label="Delete message"
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900"
        >
          <Trash className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
