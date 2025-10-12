// frontend/rockbot-ui/src/components/ChatInterface.jsx
// Big, comprehensive Chat interface implementing:
// - Multi-agent selection
// - Conversation list with create/delete/share/export
// - Message list with proper toolbars (user vs assistant)
// - Optimistic updates and graceful error handling
// - Theme (light/dark) persistence
// - File upload integration (calls /api/upload)
// - Safe fallbacks if some backend endpoints are missing
//
// NOTE: This file intentionally is long and explicit to cover all behaviors
// and to make debugging easy. Trim later if you prefer smaller components.

import React, { useEffect, useRef, useState } from "react";

// Keep these imports — your project already has these UI pieces.
// They may be used by your app; we also build some UI inside this file
// so the ChatInterface remains robust even if some ui/* components behave differently.
import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import EmptyState from "@/components/ui/empty-state";
import ChatContainer from "@/components/ui/chat-container";
import FileUploader from "@/components/ui/file-uploader";
import Message from "@/components/ui/message";
import TypingIndicator from "@/components/ui/typing-indicator";
import ThemeToggle from "@/components/ui/theme-toggle";
import ChatHeaderExtras from "@/components/ui/chat-header-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons & motion
import { Send, Loader2, ChevronDown, Copy, Trash2, Edit3, Download, Share2, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

/**
 * API base detection:
 * - Prefer Vite env var VITE_API_BASE_URL (set in .env.production)
 * - If not present, fallback to relative '/api' (works when served from same origin)
 * - If the app is served from a different host than API, set the VITE_API_BASE_URL.
 */
const ENV_API = import.meta.env?.VITE_API_BASE_URL;
const API_BASE = ENV_API && ENV_API.length > 0 ? ENV_API.replace(/\/$/, "") : "/api";

/**
 * Utility helpers
 */
function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Small local MessageBubble component so we can absolutely control the toolbar
 * appearance for assistant vs user messages. This will be used in mapping over
 * messages if your imported Message component doesn't implement exactly our logic.
 *
 * If your project's Message component is feature-complete, you can remove this local
 * component and use the imported one — we include both imports so build is safe.
 */
function MessageBubble({ msg, isOwn, onEdit, onDelete, onCopy, onLike, onDislike, onReply }) {
  const baseCls =
    "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words leading-relaxed shadow-sm";
  const userCls = "bg-blue-600 text-white self-end";
  const assistantCls = "bg-gray-800 text-white/90 self-start";

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} py-1`}>
      <div className={`max-w-[78%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div className={`${baseCls} ${isOwn ? userCls : assistantCls}`}>
          {/* message content */}
          <div>{msg.content}</div>
          {/* small timestamp */}
          <div className="text-[10px] opacity-70 mt-1 text-right">{formatTime(msg.timestamp)}</div>
        </div>

        {/* toolbar */}
        <div className="mt-1 flex gap-1">
          {isOwn ? (
            <>
              <button
                title="Edit message"
                onClick={() => onEdit?.(msg)}
                className="p-1 rounded border hover:bg-white/5"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                title="Delete message"
                onClick={() => onDelete?.(msg)}
                className="p-1 rounded border hover:bg-white/5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                title="Copy"
                onClick={() => onCopy?.(msg.content)}
                className="p-1 rounded border hover:bg-white/5"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                title="Like"
                onClick={() => onLike?.(msg)}
                className="p-1 rounded border hover:bg-white/5"
              >
                👍
              </button>

              <button
                title="Dislike"
                onClick={() => onDislike?.(msg)}
                className="p-1 rounded border hover:bg-white/5"
              >
                👎
              </button>

              <button
                title="Reply"
                onClick={() => onReply?.(msg)}
                className="p-1 rounded border hover:bg-white/5"
              >
                ↩
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline Sidebar rendering (fallback) — ensures delete/share/export exists even if your imported Sidebar
 * doesn't implement all actions. We will try to pass these handlers to the imported Sidebar as props, but
 * if it ignores them, this internal Sidebar below will guarantee the UX.
 */
function LocalSidebar({ conversations, currentConversation, onSelect, onNew, onDelete, onExport, onShare, onToggleMobile }) {
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

/**
 * AgentSelector UI - shows list of agents and allows picking.
 * Agents data shape expected: { agentKey: { name, capabilities, ... } }
 */
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

/**
 * FileUploaderInline - a simple file input that posts to /api/upload (multimodal)
 * and returns an object `{ localUrl, name, data }` matching the expectations in sendMessage.
 */
function FileUploaderInline({ onUploadComplete }) {
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // show local preview immediately
    const localUrl = URL.createObjectURL(file);
    const name = file.name;
    // Basic upload: call backend
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
      if (!res.ok) {
        // fallback: return local info without backend metadata
        onUploadComplete?.({ localUrl, name, data: null });
        return;
      }
      const json = await res.json();
      // Expect backend to return metadata url or similar
      onUploadComplete?.({ localUrl, name, data: json });
    } catch (e) {
      console.warn("File upload failed", e);
      onUploadComplete?.({ localUrl, name, data: null });
    } finally {
      // reset input
      fileRef.current.value = "";
    }
  }

  return (
    <div>
      <input ref={fileRef} type="file" onChange={handleFile} className="hidden" id="fileuploader-inline" />
      <label htmlFor="fileuploader-inline" className="px-3 py-1 border rounded cursor-pointer">
        Attach
      </label>
    </div>
  );
}

/**
 * ChatInterface main component
 */
export default function ChatInterface() {
  // app state
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState({});
  const [selectedAgent, setSelectedAgent] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("rockbot_theme") || "dark";
    } catch {
      return "dark";
    }
  });

  // refs
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // Theme persistence
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("rockbot_theme", theme);
    } catch { }
  }, [theme]);

  // initial load
  useEffect(() => {
    loadAgents();
    loadConversations();
  }, []);

  // load messages when conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      loadConversation(currentConversation.id);
    } else {
      setMessages([]);
    }
  }, [currentConversation?.id]);

  // autoscroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, isTyping]);

  // -------------------------
  // API calls
  // -------------------------

  async function loadAgents() {
    try {
      const res = await fetch(`${API_BASE}/agents`);
      if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
      const data = await res.json();
      setAgents(data || {});
      // set selected agent to first key if not set
      const keys = Object.keys(data || {});
      if (!selectedAgent && keys.length > 0) {
        setSelectedAgent(keys[0]);
      } else if (!selectedAgent) {
        setSelectedAgent("general");
      }
    } catch (e) {
      console.warn("loadAgents error", e);
      // Keep selectedAgent default
    }
  }

  async function loadConversations() {
    try {
      const res = await fetch(`${API_BASE}/conversations`);
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      if (!currentConversation && Array.isArray(data) && data.length > 0) {
        setCurrentConversation(data[0]);
      }
    } catch (e) {
      console.warn("loadConversations error", e);
    }
  }

  async function loadConversation(id) {
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const json = await res.json();
      setCurrentConversation(json.conversation || { id });
      setMessages(json.messages || []);
    } catch (e) {
      console.warn("loadConversation error", e);
    }
  }

  async function createNewConversation() {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const json = await res.json();
      setCurrentConversation(json);
      setMessages([]);
      await loadConversations();
    } catch (e) {
      console.warn("createNewConversation error", e);
    }
  }

  async function deleteConversation(conversation) {
    if (!conversation?.id) return;
    if (!confirm("Delete this conversation?")) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversation.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete conversation");
      // Remove from ui
      setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (e) {
      console.warn("deleteConversation error", e);
      alert("Failed to delete conversation");
    }
  }

  async function exportConversationPDF(conversation) {
    if (!conversation?.id) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversation.id}/pdf`);
      if (!res.ok) {
        // fallback to text export endpoint
        const t = await (await fetch(`${API_BASE}/conversations/${conversation.id}/export`)).json();
        const blob = new Blob([t.export_text], { type: "text/plain" });
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
      console.warn("exportConversationPDF error", e);
      alert("Export failed");
    }
  }

  async function shareConversation(conversation) {
    if (!conversation?.id) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversation.id}/export`);
      if (!res.ok) throw new Error("Share failed");
      const data = await res.json();
      const text = data.export_text || JSON.stringify(data.share_data || {});
      if (navigator.share) {
        await navigator.share({ title: conversation.title || "Conversation", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Conversation copied to clipboard");
      }
    } catch (e) {
      console.warn("shareConversation error", e);
      alert("Failed to share conversation");
    }
  }

  // -------------------------
  // Messages / editor / send
  // -------------------------

  function startEdit(msg) {
    if (!msg) return;
    setEditingId(msg.id);
    setEditingText(msg.content || "");
    // focus handled by input
  }

  async function saveEditedMessage(id, newContent) {
    // optimistic UI update
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: newContent } : m)));
    setEditingId(null);
    setEditingText("");

    // optional backend call - may not exist
    try {
      const res = await fetch(`${API_BASE}/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        console.warn("edit message not supported on server or failed", await res.text());
      }
    } catch (e) {
      console.warn("saveEditedMessage error", e);
    }
  }

  async function deleteMessage(msg) {
    // optimistic UI
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    try {
      const res = await fetch(`${API_BASE}/messages/${msg.id}`, { method: "DELETE" });
      if (!res.ok) {
        console.warn("server delete message failed", await res.text());
      }
    } catch (e) {
      console.warn("deleteMessage error", e);
    }
  }

  function copyTextToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch((e) => console.warn("copy failed", e));
  }

  async function reactMessage(id, reaction) {
    // optimistic UI: find message and bump counts
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, likes: reaction === "like" ? (m.likes || 0) + 1 : m.likes || 0, dislikes: reaction === "dislike" ? (m.dislikes || 0) + 1 : m.dislikes || 0 } : m)));
    // optional server call
    try {
      const res = await fetch(`${API_BASE}/messages/${id}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
      if (!res.ok) {
        console.warn("server reaction failed", await res.text());
      }
    } catch (e) {
      console.warn("reactMessage error", e);
    }
  }

  function replyToMessage(msg) {
    if (!msg) return;
    setInputMessage((prev) => `${prev}${prev ? " " : ""}@reply: ${msg.content.slice(0, 120)} `);
    // focus input ideally
    const el = document.querySelector("textarea[data-rockbot-input]");
    el?.focus?.();
  }

  /**
   * sendMessage: central function to send
   * - supports optimistic user message
   * - supports filePayload objects returned by file uploader (localUrl, name, data)
   */
  async function sendMessage(editId = null, filePayload = null) {
    const content = editId ? editingText.trim() : inputMessage.trim();

    if (!content && !filePayload) return;

    if (editId) {
      await saveEditedMessage(editId, content);
      return;
    }

    // optimistic user message
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

    try {
      // request body
      const body = {
        message: content,
        conversation_id: currentConversation?.id,
        agent_type: selectedAgent,
      };

      if (filePayload?.data) body.file = filePayload.data;

      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // failure fallback
        const errText = await res.text();
        throw new Error(`Chat failed: ${errText}`);
      }

      const json = await res.json();

      // replace tmp message (sending) with server id if returned
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? { ...m, sending: false, id: json?.user_message?.id || json?.user_message_id || m.id } : m)));

      // attach assistant response(s)
      if (json?.ai_response) {
        const aiList = Array.isArray(json.ai_response) ? json.ai_response : [json.ai_response];
        const toAppend = aiList.map((r) => {
          if (typeof r === "string") {
            return { id: uid("ai-"), role: "assistant", content: r, timestamp: new Date().toISOString(), likes: 0, dislikes: 0 };
          } else {
            // if server returns message object
            return { id: r.id || uid("ai-"), role: "assistant", content: r.content || r.text || JSON.stringify(r).slice(0, 300), timestamp: r.timestamp || new Date().toISOString(), likes: r.likes || 0, dislikes: r.dislikes || 0 };
          }
        });
        setMessages((prev) => [...prev, ...toAppend]);
      } else {
        // fallback assistant message
        setMessages((prev) => [
          ...prev,
          { id: uid("ai-"), role: "assistant", content: json?.response || "No response.", timestamp: new Date().toISOString(), likes: 0, dislikes: 0 },
        ]);
      }

      // if new conversation created by server, update current conversation
      if (!currentConversation && json?.conversation_id) {
        setCurrentConversation({ id: json.conversation_id });
        await loadConversations();
      } else {
        // else refresh conversations list to update timestamps
        await loadConversations();
      }
    } catch (err) {
      console.error("sendMessage error", err);
      setMessages((prev) => [
        ...prev,
        { id: uid("ai-err"), role: "assistant", content: `Sorry — I couldn't send the message: ${err.message}`, timestamp: new Date().toISOString(), likes: 0, dislikes: 0 },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsTyping(false), 200);
    }
  }

  // -------------------------
  // UI Actions & small helpers
  // -------------------------
  function toggleSidebar() {
    setShowSidebar((s) => !s);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-2 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="w-full max-w-6xl h-[92vh] rounded-2xl overflow-hidden bg-[#0f1724] border border-white/5 flex shadow-2xl">
        {/* Sidebar */}
        <div className={`bg-[#0b1220] border-r border-white/5 transition-transform ${showSidebar ? "w-80" : "w-0 overflow-hidden"}`}>
          {/* Try to render imported Sidebar if it expects props; otherwise fallback to LocalSidebar */}
          {/* We pass handlers in case your Sidebar uses them. If it doesn't, LocalSidebar below ensures actions exist. */}
          <div className="h-full">
            {/* If your Sidebar component expects different props, it will simply ignore extras. */}
            {/* Render both: imported Sidebar (if present) and fallback list. */}
            <div className="hidden">
              {/* keep import usage so bundler doesn't tree-shake the import away; but hidden */}
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

            {/* Visible fallback sidebar */}
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
              <button onClick={toggleSidebar} className="px-2 py-1 border rounded bg-white/5">
                ☰
              </button>
              <div className="text-xl font-bold">Rockbot</div>
              <div className="text-sm opacity-80">{currentConversation?.title || "No conversation selected"}</div>
            </div>

            <div className="flex items-center gap-3">
              {/* Agent selector */}
              <AgentSelector agents={agents} selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} />

              {/* theme toggle */}
              {/* <button
                onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                title="Toggle theme"
                className="px-2 py-1 rounded border bg-white/5"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button> */}
              <ThemeToggle className="ml-2" />


              {/* Export/share buttons */}
              <div className="flex gap-1">
                <button
                  title="Export conversation"
                  onClick={() => exportConversationPDF(currentConversation)}
                  className="p-1 rounded border"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  title="Share conversation"
                  onClick={() => shareConversation(currentConversation)}
                  className="p-1 rounded border"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 relative">
            {!currentConversation ? (
              <div className="h-full flex items-center justify-center">
                <EmptyState onCreate={createNewConversation} />
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div ref={scrollAreaRef} className="flex-1 overflow-auto p-6">
                  <div className="mx-auto max-w-4xl">
                    <div className="flex flex-col gap-2">
                      {/* Messages */}
                      {messages.length === 0 && !isTyping ? (
                        <div className="text-center text-sm opacity-70 py-8">No messages yet — start the conversation below.</div>
                      ) : (
                        messages.map((m) => {
                          const isOwn = m.role === "user";
                          // If editing this message, show inline edit box (user messages only)
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

                          // For assistant messages, provide like/dislike/copy/reply
                          if (!isOwn) {
                            return (
                              <div key={m.id || uid("a-")} className={`w-full ${isOwn ? "flex justify-end" : "flex justify-start"} py-1`}>
                                <div className="w-full max-w-[78%]">
                                  {/* Use imported Message component if available (expected to render nicely).
                                      If your imported Message ignores props, our MessageBubble ensures actions exist. */}
                                  <div className="mb-1">
                                    <Message
                                      message={m}
                                      isOwn={isOwn}
                                      onCopy={() => copyTextToClipboard(m.content)}
                                      onLike={() => reactMessage(m.id, "like")}
                                      onDislike={() => reactMessage(m.id, "dislike")}
                                      onReply={() => replyToMessage(m)}
                                      showAvatar
                                      showToolbar={false} // we render our own toolbar to ensure correct actions
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

                          // For user messages, show edit/delete
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

                {/* Input / actions */}
                <div className="px-4 py-3 border-t border-white/5 bg-[#061124]">
                  <div className="max-w-4xl mx-auto flex items-center gap-3">
                    {/* File uploader (inline) */}
                    <FileUploaderInline onUploadComplete={async (payload) => {
                      // payload: { localUrl, name, data }
                      if (!payload) return;
                      // send as message with attachment
                      await sendMessage(null, payload);
                    }} />

                    {/* Message input */}
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
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// frontend/rockbot-ui/src/components/ChatInterface.jsx
