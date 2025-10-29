// frontend/rockbot-ui/src/components/ChatInterface.jsx
// Extended, self-contained Chat interface (Option 1 - direct API calls).
// Purpose: fix the issues you described (sidebar toggling, theme persistence,
// agent selection, assistant toolbar restrictions, delete persistence across refresh,
// autoscroll logic, fallback behaviors when backend endpoints missing).
//
// Notes:
// - Uses fetch(...) to call `${API_BASE}/...` endpoints directly.
// - If backend DELETE/message endpoints are missing, we fall back to localStorage
//   to persist deleted-message ids per conversation so deletions survive refresh.
// - Theme is persisted via localStorage and applies 'dark' class to <html> (tailwind dark mode 'class').
// - Autoscroll behavior: stays on by default, but will stop when user scrolls up.
// - Agent selection: loaded from /api/agents; fallback default agents provided locally.
// - Message toolbar: assistant messages only have copy/like/dislike/reply; user messages have edit/delete.
// - File upload: posts to /api/upload (multimodal), but gracefully handles backend not implementing it.
//
// This file intentionally contains many helpers and inline fallback UI so it can work
// even if some ui components are missing or behave differently in your existing project.

import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, ChevronDown, Copy, Trash2, Edit3, Download, Share2, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

// Try to import existing UI components if present. We will also provide fallbacks inside this file.
import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import EmptyState from "@/components/ui/empty-state";
import ChatContainer from "@/components/ui/chat-container";
import FileUploader from "@/components/ui/file-uploader";
import Message from "@/components/ui/message";
import TypingIndicator from "@/components/ui/typing-indicator";
// Button / Input - many projects export named Button; ensure we use named import to avoid "default not exported" build errors
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// If any of the imports above fail to exist at runtime bundling, our fallback UI elements in this file
// will provide necessary UI. (During build, missing imports will break — ensure those files exist or
// replace the import paths you don't use.)

// API Base: prefer Vite env var, else fallback to '/api' which works when frontend served from same origin as backend.
const ENV_API = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined;
const API_BASE = ENV_API && ENV_API.length > 0 ? ENV_API.replace(/\/$/, "") : "/api";

// localStorage keys
const LS_THEME_KEY = "rockbot_theme_v1";
const LS_DELETED_KEY = "rockbot_deleted_msgs_v1"; // stores { [conversationId]: [msgId, ...] }

// ---------- Utility helpers ----------
function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}
function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}
function safeParseJSON(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

// ---------- Local persistence helpers (deleted messages fallback) ----------
function readDeletedMap() {
  try {
    const raw = localStorage.getItem(LS_DELETED_KEY);
    return raw ? safeParseJSON(raw, {}) : {};
  } catch {
    return {};
  }
}
function writeDeletedMap(map) {
  try {
    localStorage.setItem(LS_DELETED_KEY, JSON.stringify(map));
  } catch {}
}
function markMessageDeletedLocally(conversationId, msgId) {
  const map = readDeletedMap();
  if (!map[conversationId]) map[conversationId] = [];
  if (!map[conversationId].includes(msgId)) map[conversationId].push(msgId);
  writeDeletedMap(map);
}
function isMessageLocallyDeleted(conversationId, msgId) {
  const map = readDeletedMap();
  return Array.isArray(map[conversationId]) && map[conversationId].includes(msgId);
}
function removeLocalDeletedMark(conversationId, msgId) {
  const map = readDeletedMap();
  if (!map[conversationId]) return;
  map[conversationId] = map[conversationId].filter((id) => id !== msgId);
  writeDeletedMap(map);
}

// ---------- Fallback default agents (if /api/agents is missing) ----------
const FALLBACK_AGENTS = {
  general: { name: "General Assistant", description: "General purpose assistant." },
  translator: { name: "Translator", description: "Translate text across languages." },
  creative: { name: "Creative Writer", description: "Generates creative content." },
  coder: { name: "Code Assistant", description: "Helps with coding tasks." },
};

// ---------- Message Bubble (fallback) ----------
// Keeps consistent toolbar for assistant vs user messages.
function MessageBubble({
  msg,
  isOwn,
  onEdit,
  onDelete,
  onCopy,
  onLike,
  onDislike,
  onReply,
  showAvatar = true,
}) {
  const containerClass = isOwn ? "justify-end" : "justify-start";
  const bubbleClass = isOwn ? "bg-blue-600 text-white" : "bg-gray-800 text-white/95";
  return (
    <div className={`w-full flex ${containerClass} py-1`}>
      <div className="max-w-[78%] flex flex-col">
        <div className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${bubbleClass} shadow-sm`}>
          <div>{msg.content}</div>
          <div className="text-[10px] opacity-60 mt-1 text-right">{formatTime(msg.timestamp)}</div>
        </div>

        <div className="mt-1 flex gap-1">
          {isOwn ? (
            <>
              <button title="Edit" onClick={() => onEdit?.(msg)} className="p-1 rounded border hover:bg-white/5">
                <Edit3 className="w-4 h-4" />
              </button>
              <button title="Delete" onClick={() => onDelete?.(msg)} className="p-1 rounded border hover:bg-white/5">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button title="Copy" onClick={() => onCopy?.(msg.content)} className="p-1 rounded border hover:bg-white/5">
                <Copy className="w-4 h-4" />
              </button>
              <button title="Like" onClick={() => onLike?.(msg)} className="p-1 rounded border hover:bg-white/5">
                👍
              </button>
              <button title="Dislike" onClick={() => onDislike?.(msg)} className="p-1 rounded border hover:bg-white/5">
                👎
              </button>
              <button title="Reply" onClick={() => onReply?.(msg)} className="p-1 rounded border hover:bg-white/5">
                ↩
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Local Sidebar fallback UI ----------
function LocalSidebar({
  conversations,
  currentConversation,
  onSelect,
  onNew,
  onDelete,
  onExport,
  onShare,
  onToggleMobile,
}) {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-3 py-3 border-b flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">Rockbot</div>
          <div className="text-xs opacity-70">Your assistant</div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onNew} title="New conversation" className="px-2 py-1 border rounded">New</button>
          <button onClick={onToggleMobile} title="Toggle sidebar" className="px-2 py-1 border rounded">☰</button>
        </div>
      </div>

      <div className="overflow-auto flex-1">
        {conversations.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No conversations yet</div>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              className={`p-2 border-b flex items-center justify-between cursor-pointer ${currentConversation?.id === c.id ? "bg-white/5" : ""}`}
            >
              <div onClick={() => onSelect(c)} className="flex-1">
                <div className="font-medium">{c.title || "Untitled"}</div>
                <div className="text-xs opacity-60">{new Date(c.updated_at || c.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-1">
                <button title="Export PDF" onClick={() => onExport(c)} className="p-1 rounded border">
                  <Download className="w-4 h-4" />
                </button>
                <button title="Share" onClick={() => onShare(c)} className="p-1 rounded border">
                  <Share2 className="w-4 h-4" />
                </button>
                <button title="Delete" onClick={() => onDelete(c)} className="p-1 rounded border">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------- Agent selector ----------
function AgentSelector({ agents, selectedAgent, setSelectedAgent }) {
  const keys = Object.keys(agents || {});
  if (keys.length === 0) {
    return <div className="text-sm text-gray-400">No agents</div>;
  }
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs opacity-80">Agent</label>
      <select
        value={selectedAgent}
        onChange={(e) => setSelectedAgent(e.target.value)}
        className="px-2 py-1 rounded border bg-white/90"
      >
        {keys.map((k) => (
          <option key={k} value={k}>
            {agents[k].name || k}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------- File uploader inline (fallback) ----------
function FileUploaderInline({ onUploadComplete }) {
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    const name = file.name;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
      if (!res.ok) {
        onUploadComplete?.({ localUrl, name, data: null });
        return;
      }
      const json = await res.json();
      onUploadComplete?.({ localUrl, name, data: json });
    } catch (e) {
      console.warn("File upload failed:", e);
      onUploadComplete?.({ localUrl, name, data: null });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={fileRef} type="file" onChange={handleFile} className="hidden" id="rb-file-inline" />
      <label htmlFor="rb-file-inline" className="px-3 py-1 border rounded cursor-pointer">Attach</label>
    </div>
  );
}

// ---------- Theme Toggle (local) ----------
function ThemeToggleLocal({ className = "", theme, setTheme }) {
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className={`p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition ${className}`}
      title="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

// ---------- Main ChatInterface component ----------
export default function ChatInterface() {
  // app state
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState(FALLBACK_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState("general");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(LS_THEME_KEY) || "dark";
    } catch {
      return "dark";
    }
  });
  const [autoscroll, setAutoscroll] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // refs
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // apply theme on mount + persist
  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.toggle("dark", theme === "dark");
      localStorage.setItem(LS_THEME_KEY, theme);
    } catch {}
  }, [theme]);

  // load agents and conversations initially
  useEffect(() => {
    (async () => {
      try {
        await loadAgents();
        await loadConversations();
      } finally {
        setLoadingInitial(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load messages when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      loadConversation(currentConversation.id);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversation?.id]);

  // autoscroll to bottom when messages appended (if autoscroll is true)
  useEffect(() => {
    if (autoscroll) {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

  // monitor user scrolling to toggle autoscroll automatically when user scrolls up
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120; // threshold
        if (!nearBottom && autoscroll) {
          setAutoscroll(false);
        } else if (nearBottom && !autoscroll) {
          setAutoscroll(true);
        }
        ticking = false;
      });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [autoscroll]);

  // ---------- API functions ----------

  async function safeFetchJson(url, opts = {}) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) {
        const txt = await res.text();
        const e = new Error(`HTTP ${res.status}: ${txt}`);
        e.status = res.status;
        throw e;
      }
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) return await res.json();
      // if not json, return text
      return await res.text();
    } catch (err) {
      throw err;
    }
  }

  // load available agents
  async function loadAgents() {
    try {
      const data = await safeFetchJson(`${API_BASE}/agents`);
      if (data && typeof data === "object") {
        setAgents(data);
        // pick first agent if none selected
        const keys = Object.keys(data || {});
        if (keys.length > 0 && !selectedAgent) setSelectedAgent(keys[0]);
      }
    } catch (e) {
      console.warn("Could not load agents, using fallback:", e);
      setAgents((prev) => (prev && Object.keys(prev).length > 0 ? prev : FALLBACK_AGENTS));
    }
  }

  // load conversations list
  async function loadConversations() {
    try {
      const data = await safeFetchJson(`${API_BASE}/conversations`);
      if (Array.isArray(data)) {
        setConversations(data);
        // set first conversation active if no current conversation
        if (!currentConversation && data.length > 0) {
          setCurrentConversation(data[0]);
        }
      } else {
        setConversations([]);
      }
    } catch (e) {
      console.warn("loadConversations failed:", e);
      setConversations([]);
    }
  }

  // load single conversation (messages + meta)
  async function loadConversation(id) {
    if (!id) return;
    try {
      const data = await safeFetchJson(`${API_BASE}/conversations/${id}`);
      // server expected shape: { conversation, messages } or { conversation: {...}, messages: [...] }
      const conv = data?.conversation || data;
      const msgs = data?.messages || data?.messages === undefined ? (data.messages || []) : [];
      // Some APIs return messages inside the top-level response (e.g. { messages: [...] }).
      // We'll try multiple fallbacks:
      let messageList = [];
      if (Array.isArray(msgs) && msgs.length > 0) {
        messageList = msgs;
      } else if (Array.isArray(data?.messages)) {
        messageList = data.messages;
      } else if (Array.isArray(data)) {
        messageList = data;
      }

      // Apply local deleted message filtration
      messageList = (messageList || []).filter((m) => !isMessageLocallyDeleted(String(id), String(m.id || m._id || m.temp_id || uid("x"))));

      setCurrentConversation(conv || { id });
      setMessages(messageList);
    } catch (e) {
      console.warn("loadConversation failed, trying fallback /conversations/{id}/messages:", e);
      // fallback: try /conversations/{id}/messages
      try {
        const fallback = await safeFetchJson(`${API_BASE}/conversations/${id}/messages`);
        const msgList = Array.isArray(fallback) ? fallback : fallback?.messages || [];
        const filtered = msgList.filter((m) => !isMessageLocallyDeleted(String(id), String(m.id || m._id || uid("x"))));
        setMessages(filtered);
      } catch (e2) {
        console.warn("fallback loadConversation failed too: ", e2);
        setMessages([]);
      }
    }
  }

  // create conversation
  async function createNewConversation() {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (!res.ok) {
        // fallback: create a local conversation object
        const conv = { id: uid("conv-"), title: "New Conversation", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setConversations((prev) => [conv, ...(prev || [])]);
        setCurrentConversation(conv);
        setMessages([]);
        return;
      }
      const json = await res.json();
      // server might return the created conversation object or minimal info
      const conv = json || (await res.json());
      setConversations((prev) => [conv, ...(prev || [])]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch (e) {
      console.warn("createNewConversation fallback:", e);
      // fallback local conv
      const conv = { id: uid("conv-"), title: "New Conversation", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setConversations((prev) => [conv, ...(prev || [])]);
      setCurrentConversation(conv);
      setMessages([]);
    }
  }

  // delete conversation
  async function deleteConversation(conversation) {
    if (!conversation?.id) return;
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversation.id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(`Failed to delete: ${res.status}`);
      }
      // remove locally
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.warn("deleteConversation fallback:", e);
      // fallback local removal
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    }
  }

  // export conversation as PDF (or fallback to text)
  async function exportConversationPDF(conversation) {
    if (!conversation?.id) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversation.id}/pdf`);
      if (!res.ok) {
        // fallback to text export endpoint
        const t = await (await fetch(`${API_BASE}/conversations/${conversation.id}/export`)).json();
        const blob = new Blob([t.export_text || JSON.stringify(t.share_data || {})], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `conversation-${conversation.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversation-${conversation.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("exportConversationPDF failed:", e);
      alert("Export failed");
    }
  }

  // share conversation
  async function shareConversation(conversation) {
    if (!conversation?.id) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversation.id}/export`);
      if (!res.ok) throw new Error("share failed");
      const data = await res.json();
      const text = data.export_text || JSON.stringify(data.share_data || {});
      if (navigator.share) {
        await navigator.share({ title: conversation.title || "Conversation", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Conversation copied to clipboard");
      }
    } catch (e) {
      console.warn("shareConversation failed:", e);
      alert("Share failed");
    }
  }

  // ---------- Message operations ----------

  function startEdit(msg) {
    if (!msg) return;
    setEditingId(msg.id);
    setEditingText(msg.content || "");
    // optionally focus the input; handled below when editing occurs
  }

  async function saveEditedMessage(id, newContent) {
    // optimistic UI
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: newContent } : m)));
    setEditingId(null);
    setEditingText("");

    // try server edit endpoint
    try {
      const res = await fetch(`${API_BASE}/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        console.warn("Server did not accept edit:", await res.text());
      }
    } catch (e) {
      console.warn("saveEditedMessage fallback:", e);
    }
  }

  // delete message with persistence fallback
  async function deleteMessage(msg) {
    if (!msg?.id) {
      // remove locally without contacting server (unknown id)
      setMessages((prev) => prev.filter((m) => m !== msg));
      return;
    }
    // optimistic UI
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));

    // Try server DELETE endpoint first
    try {
      const res = await fetch(`${API_BASE}/messages/${msg.id}`, { method: "DELETE" });
      if (res.ok) {
        // success - also remove any local deleted mark
        removeLocalDeletedMark(String(currentConversation?.id || ""), String(msg.id));
        return;
      }
      // if server returns 404/405/other, fallback to alternative persistence
      console.warn("Server delete returned", res.status);
    } catch (e) {
      console.warn("Server delete failed:", e);
    }

    // fallback #1: try to update conversation by sending messages list (server may support)
    try {
      const convId = currentConversation?.id;
      if (convId) {
        // Build message list to send (without deleted message)
        const payloadMessages = (messages || []).filter((m) => m.id !== msg.id);
        const res2 = await fetch(`${API_BASE}/conversations/${convId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payloadMessages }),
        });
        if (res2.ok) {
          return;
        } else {
          console.warn("PUT conversation to remove message failed:", res2.status);
        }
      }
    } catch (e2) {
      console.warn("PUT conversation fallback error:", e2);
    }

    // fallback #2: persist deletion locally using localStorage so it survives refresh
    try {
      markMessageDeletedLocally(String(currentConversation?.id || "local"), String(msg.id));
    } catch (e3) {
      console.warn("markMessageDeletedLocally failed:", e3);
    }
  }

  // copy text to clipboard
  function copyTextToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch((e) => console.warn("copy failed", e));
  }

  // reactMessage (like/dislike)
  async function reactMessage(id, reaction) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, likes: reaction === "like" ? (m.likes || 0) + 1 : m.likes || 0, dislikes: reaction === "dislike" ? (m.dislikes || 0) + 1 : m.dislikes || 0 } : m)));
    try {
      const res = await fetch(`${API_BASE}/messages/${id}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
      if (!res.ok) {
        console.warn("Server reaction failed", await res.text());
      }
    } catch (e) {
      console.warn("reactMessage fallback:", e);
    }
  }

  function replyToMessage(msg) {
    if (!msg) return;
    setInputMessage((prev) => `${prev ? prev + " " : ""}> ${msg.content.slice(0, 200)} `);
    const el = document.querySelector("textarea[data-rockbot-input]");
    el?.focus?.();
  }

  // ---------- Sending messages (optimistic + agent param) ----------
  async function sendMessage(editId = null, filePayload = null) {
    const content = editId ? editingText.trim() : inputMessage.trim();
    if (!content && !filePayload) return;

    if (editId) {
      await saveEditedMessage(editId, content);
      return;
    }

    const tmpId = uid("tmp-");
    const userMessage = {
      id: tmpId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      sending: true,
      likes: 0,
      dislikes: 0,
      file: filePayload ? { url: filePayload.localUrl, name: filePayload.name, meta: filePayload.data || null } : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setIsTyping(true);
    setAutoscroll(true);

    try {
      const body = {
        message: content,
        conversation_id: currentConversation?.id,
        agent_type: selectedAgent || "general",
      };
      if (filePayload?.data) body.file = filePayload.data;

      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "no details");
        throw new Error(`Chat request failed: ${txt}`);
      }
      const json = await res.json();

      // replace tmp message id if server returned user_message.id
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? { ...m, sending: false, id: json?.user_message?.id || json?.user_message_id || m.id } : m)));

      // append ai response(s)
      if (json?.ai_response) {
        const aiList = Array.isArray(json.ai_response) ? json.ai_response : [json.ai_response];
        const toAppend = aiList.map((r) => {
          if (typeof r === "string") {
            return { id: uid("ai-"), role: "assistant", content: r, timestamp: new Date().toISOString(), likes: 0, dislikes: 0 };
          } else {
            return { id: r.id || uid("ai-"), role: "assistant", content: r.content || r.text || JSON.stringify(r).slice(0, 300), timestamp: r.timestamp || new Date().toISOString(), likes: r.likes || 0, dislikes: r.dislikes || 0 };
          }
        });
        setMessages((prev) => [...prev, ...toAppend]);
      } else {
        // fallback if server returned `response` or single string
        const fallbackText = json?.response || json?.text || "No assistant response";
        setMessages((prev) => [...prev, { id: uid("ai-"), role: "assistant", content: fallbackText, timestamp: new Date().toISOString(), likes: 0, dislikes: 0 }]);
      }

      // if server created new conversation id, update local list
      if (!currentConversation && json?.conversation_id) {
        const conv = { id: json.conversation_id, title: "Conversation", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setCurrentConversation(conv);
        await loadConversations();
      } else {
        // refresh conversation list to update timestamps
        await loadConversations();
      }
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages((prev) => [...prev, { id: uid("ai-err"), role: "assistant", content: `Sorry — I couldn't send the message: ${err.message}`, timestamp: new Date().toISOString(), likes: 0, dislikes: 0 }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsTyping(false), 200);
    }
  }

  // ---------- Helper UI actions ----------
  function toggleSidebar() {
    setShowSidebar((s) => !s);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ------------- Render -------------
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-2 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="w-full max-w-6xl h-[92vh] rounded-2xl overflow-hidden bg-[#0f1724] border border-white/5 flex shadow-2xl">
        {/* Sidebar */}
        <div className={`bg-[#0b1220] border-r border-white/5 transition-all ${showSidebar ? "w-80" : "w-0 overflow-hidden"}`}>
          <div className="h-full">
            {/* Hidden import usage - prevents tree-shake but remains hidden */}
            <div className="hidden">
              <Sidebar
                conversations={conversations}
                currentConversation={currentConversation}
                onSelectConversation={(c) => {
                  setCurrentConversation(c);
                  loadConversation(c.id);
                }}
                onNewConversation={createNewConversation}
                onDeleteConversation={deleteConversation}
                onExportConversation={exportConversationPDF}
                onShareConversation={shareConversation}
                onToggleMobile={toggleSidebar}
              />
            </div>

            {/* Visible fallback */}
            <LocalSidebar
              conversations={conversations}
              currentConversation={currentConversation}
              onSelect={(c) => {
                setCurrentConversation(c);
                loadConversation(c.id);
              }}
              onNew={createNewConversation}
              onDelete={deleteConversation}
              onExport={exportConversationPDF}
              onShare={shareConversation}
              onToggleMobile={toggleSidebar}
            />
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 bg-[#061124] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="px-2 py-1 border rounded bg-white/5">☰</button>
              <div className="text-xl font-bold">Rockbot</div>
              <div className="text-sm opacity-80">{currentConversation?.title || "No conversation selected"}</div>
            </div>

            <div className="flex items-center gap-3">
              <AgentSelector agents={agents} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} />

              {/* theme toggle - local */}
              <ThemeToggleLocal theme={theme} setTheme={setTheme} className="ml-2" />

              {/* Export / Share */}
              <div className="flex gap-1 ml-2">
                <button title="Export conversation" onClick={() => exportConversationPDF(currentConversation)} className="p-1 rounded border">
                  <Download className="w-4 h-4" />
                </button>
                <button title="Share conversation" onClick={() => shareConversation(currentConversation)} className="p-1 rounded border">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 relative">
            {!currentConversation ? (
              <div className="h-full flex items-center justify-center">
                {/* prefer imported EmptyState if available else fallback */}
                <div className="text-center">
                  <div className="mb-4 text-lg">No conversation selected</div>
                  <div className="flex justify-center">
                    <Button onClick={createNewConversation}>Create new conversation</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div ref={scrollContainerRef} className="flex-1 overflow-auto p-6">
                  <div className="mx-auto max-w-4xl">
                    <div className="flex flex-col gap-2">
                      {messages.length === 0 && !isTyping ? (
                        <div className="text-center text-sm opacity-70 py-8">No messages yet — start the conversation below.</div>
                      ) : (
                        messages.map((m) => {
                          const isOwn = m.role === "user";
                          // if locally deleted, skip (safety)
                          if (isMessageLocallyDeleted(String(currentConversation?.id || ""), String(m.id || m._id || m.temp_id || ""))) return null;

                          // editing UI for user's message
                          if (editingId === m.id && isOwn) {
                            return (
                              <div key={m.id || uid("editing-")} className={`w-full flex ${isOwn ? "justify-end" : "justify-start"} py-1`}>
                                <div className="max-w-[78%]">
                                  <div className="flex gap-2">
                                    <textarea
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      rows={3}
                                      className="w-full p-3 rounded-lg bg-white/5"
                                    />
                                    <div className="flex flex-col gap-2">
                                      <Button onClick={() => saveEditedMessage(m.id, editingText)}>Save</Button>
                                      <Button onClick={() => { setEditingId(null); setEditingText(""); }} variant="secondary">Cancel</Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // assistant message: show assistant toolbar (no edit/delete)
                          if (!isOwn) {
                            return (
                              <div key={m.id || uid("a-")} className={`w-full ${isOwn ? "flex justify-end" : "flex justify-start"} py-1`}>
                                <div className="w-full max-w-[78%]">
                                  {/* use imported Message component with toolbar turned off (we provide toolbar) */}
                                  <div className="mb-1">
                                    <Message
                                      message={m}
                                      isOwn={isOwn}
                                      onCopy={() => copyTextToClipboard(m.content)}
                                      onLike={() => reactMessage(m.id, "like")}
                                      onDislike={() => reactMessage(m.id, "dislike")}
                                      onReply={() => replyToMessage(m)}
                                      showAvatar
                                      showToolbar={false}
                                    />
                                  </div>

                                  {/* Fallback toolbar to guarantee correct assistant controls */}
                                  <div className="flex gap-2">
                                    <button onClick={() => copyTextToClipboard(m.content)} title="Copy" className="p-2 rounded border bg-white/5">
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => reactMessage(m.id, "like")} title="Like" className="p-2 rounded border bg-white/5">👍</button>
                                    <button onClick={() => reactMessage(m.id, "dislike")} title="Dislike" className="p-2 rounded border bg-white/5">👎</button>
                                    <button onClick={() => replyToMessage(m)} title="Reply" className="p-2 rounded border bg-white/5">↩</button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // user message (editable)
                          return (
                            <div key={m.id || uid("u-")} className={`w-full ${isOwn ? "flex justify-end" : "flex justify-start"} py-1`}>
                              <div className="w-full max-w-[78%]">
                                <Message
                                  message={m}
                                  isOwn={isOwn}
                                  onCopy={() => copyTextToClipboard(m.content)}
                                  onEdit={() => startEdit(m)}
                                  onDelete={() => deleteMessage(m)}
                                  showAvatar
                                  showToolbar
                                />
                              </div>
                            </div>
                          );
                        })
                      )}

                      {isTyping && (
                        <div className="py-2">
                          <TypingIndicator agentName={agents[selectedAgent]?.name || "Assistant"} />
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>

                {/* Input row */}
                <div className="px-4 py-3 border-t border-white/5 bg-[#061124]">
                  <div className="max-w-4xl mx-auto flex items-center gap-3">
                    {/* inline file uploader */}
                    <FileUploaderInline onUploadComplete={async (payload) => {
                      if (!payload) return;
                      await sendMessage(null, payload);
                    }} />

                    {/* message input */}
                    <div className="flex-1">
                      <textarea
                        data-rockbot-input
                        value={editingId ? editingText : inputMessage}
                        onChange={(e) => (editingId ? setEditingText(e.target.value) : setInputMessage(e.target.value))}
                        onKeyDown={handleKeyDown}
                        placeholder={editingId ? "Editing message..." : "Type your message... (Shift+Enter for newline)"}
                        className="w-full p-3 rounded bg-white/5 min-h-[44px] max-h-28 resize-none outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => sendMessage(editingId || null)} disabled={isLoading || (!inputMessage && !editingText)}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>

                      <button onClick={() => setAutoscroll((s) => !s)} title={autoscroll ? "Auto-scroll: ON" : "Auto-scroll: OFF"} className="p-2 rounded border">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* quick scroll */}
                <div className="absolute right-6 bottom-24">
                  <button onClick={() => messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" })} title="Jump to latest" className="p-3 rounded-full bg-white/80 dark:bg-gray-800/60 shadow hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
