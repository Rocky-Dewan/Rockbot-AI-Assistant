import React, { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import EmptyState from "@/components/ui/empty-state";
import ChatContainer from "@/components/ui/chat-container";
import FileUploader from "@/components/ui/file-uploader";
import Message from "@/components/ui/message";
import TypingIndicator from "@/components/ui/typing-indicator";
import ChatHeaderExtras from "@/components/ui/chat-header-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

/**
 * ChatInterface page
 * - Uses the modular components placed under src/components/ui
 * - Long / feature-complete implementation (theme persistence, inline edit, optimistic UI, reactions, file upload)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatInterface() {
  // app-level state
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [agents, setAgents] = useState({});
  const [selectedAgent, setSelectedAgent] = useState("general");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("rockbot_theme") || "light";
    } catch {
      return "light";
    }
  });
  const [autoscroll, setAutoscroll] = useState(true); // auto-scroll lock toggle

  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // ------------------- theme persistence -------------------
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("rockbot_theme", theme);
    } catch { }
  }, [theme]);

  // ------------------- initial load -------------------
  useEffect(() => {
    loadAgents();
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load messages when current conversation changes
  useEffect(() => {
    if (currentConversation?.id) {
      loadConversation(currentConversation.id);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversation?.id]);

  // autoscroll when messages or typing indicator changes
  useEffect(() => {
    if (autoscroll) {
      messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
    }
  }, [messages, isTyping, autoscroll]);

  // ------------------- api helpers -------------------
  async function loadAgents() {
    try {
      const res = await fetch(`${API_BASE}/agents`);
      if (!res.ok) return;
      const data = await res.json();
      // data shape: { agentKey: { name, description, capabilities } }
      setAgents(data || {});
      // pick first agent if none selected
      if (!selectedAgent) {
        const first = Object.keys(data || {})[0];
        setSelectedAgent(first || "general");
      }
    } catch (e) {
      console.warn("loadAgents:", e);
    }
  }

  async function loadConversations() {
    try {
      const res = await fetch(`${API_BASE}/conversations`);
      if (!res.ok) return;
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      if (!currentConversation && Array.isArray(data) && data.length > 0) {
        setCurrentConversation(data[0]);
      }
    } catch (e) {
      console.warn("loadConversations:", e);
    }
  }

  async function loadConversation(id) {
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`);
      if (!res.ok) return;
      const json = await res.json();
      setCurrentConversation(json.conversation || { id });
      setMessages(json.messages || []);
    } catch (e) {
      console.warn("loadConversation:", e);
    }
  }

  async function createNewConversation() {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (!res.ok) return;
      const json = await res.json();
      setCurrentConversation(json);
      setMessages([]);
      await loadConversations();
    } catch (e) {
      console.error("createNewConversation", e);
    }
  }

  // ------------------- message editing -------------------
  async function saveEditedMessage(id, newContent) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: newContent } : m)));
    setEditingId(null);
    setEditingText("");
    try {
      // optional endpoint
      const res = await fetch(`${API_BASE}/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        console.warn("server rejected message edit", await res.text());
      }
    } catch (e) {
      console.warn("saveEditedMessage error", e);
    }
  }

  // ------------------- sending (optimistic) -------------------
  async function sendMessage(editId = null, filePayload = null) {
    const content = editId ? editingText : inputMessage.trim();
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
    setAutoscroll(true);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const body = {
        message: content,
        conversation_id: currentConversation?.id,
        agent_type: selectedAgent,
      };

      if (filePayload?.data?.url) {
        body.file = filePayload.data;
      }

      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      // mark tmp message as sent
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? { ...m, sending: false, id: json?.user_message_id || m.id } : m)));

      // attach assistant responses (can be string / object / array)
      if (json?.ai_response) {
        const aiList = Array.isArray(json.ai_response) ? json.ai_response : [json.ai_response];
        const toAppend = aiList.map((r) =>
          typeof r === "string"
            ? { id: uid("ai-"), role: "assistant", content: r, timestamp: new Date().toISOString(), likes: 0, dislikes: 0 }
            : { ...r, id: r.id || uid("ai-"), likes: r.likes || 0, dislikes: r.dislikes || 0 }
        );
        setMessages((prev) => [...prev, ...toAppend]);
      } else {
        // fallback
        setMessages((prev) => [
          ...prev,
          { id: uid("ai-"), role: "assistant", content: "No assistant response.", timestamp: new Date().toISOString(), likes: 0, dislikes: 0 },
        ]);
      }

      // if conversation created, set
      if (!currentConversation && json?.conversation_id) {
        setCurrentConversation({ id: json.conversation_id });
        await loadConversations();
      }
    } catch (err) {
      console.error("sendMessage error", err);
      setMessages((prev) => [
        ...prev,
        { id: uid("ai-err"), role: "assistant", content: "Failed to send message. Try again.", timestamp: new Date().toISOString(), likes: 0, dislikes: 0 },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsTyping(false), 300);
    }
  }

  // ------------------- reactions, delete, copy -------------------
  async function reactMessage(id, reaction) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, likes: reaction === "like" ? (m.likes || 0) + 1 : m.likes || 0, dislikes: reaction === "dislike" ? (m.dislikes || 0) + 1 : m.dislikes || 0 } : m))
    );
    try {
      await fetch(`${API_BASE}/messages/${id}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
    } catch (e) {
      console.warn("reaction failed", e);
    }
  }

  async function deleteMessage(msg) {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    try {
      await fetch(`${API_BASE}/messages/${msg.id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("delete failed", e);
    }
  }

  function copyTextToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .catch((e) => console.warn("Clipboard write failed", e));
  }

  // ------------------- file upload integration -------------------
  async function onFileUploadComplete(result) {
    // both success and failure return here
    if (!result) return;
    // send as a message with filePayload
    await sendMessage(null, result);
  }

  // ------------------- helper UI actions -------------------
  function startEdit(msg) {
    setEditingId(msg.id);
    setEditingText(msg.content || "");
    // optionally focus input
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  function toggleSidebar() {
    setShowSidebar((s) => !s);
  }

  // quick scroll to bottom button
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }

  // ------------------- UI render -------------------
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-5xl h-[92vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg flex">
        {/* sidebar */}
        <div className={`w-80 bg-white/30 dark:bg-gray-900/40 border-r border-gray-200/10 transition-transform ${showSidebar ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}>
          <Sidebar
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={(c) => {
              setCurrentConversation(c);
              loadConversation(c.id);
            }}
            onNewConversation={createNewConversation}
            onToggleMobile={() => toggleSidebar()}
          />
        </div>

        {/* main */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200/10 bg-white/50 dark:bg-gray-900/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">Rockbot</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{currentConversation?.title || "No conversation selected"}</div>
            </div>

            <div className="flex items-center gap-3">
              <ChatHeaderExtras
                agent={agents[selectedAgent]}
                onExport={async () => {
                  if (!currentConversation) return;
                  try {
                    const resp = await fetch(`${API_BASE}/conversations/${currentConversation.id}/pdf`);
                    if (resp.ok) {
                      const blob = await resp.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `conversation-${currentConversation.id}.pdf`;
                      a.click();
                    } else {
                      alert("Export failed");
                    }
                  } catch (e) {
                    alert("Export failed: " + e.message);
                  }
                }}
                onShare={async () => {
                  if (!currentConversation) return;
                  try {
                    const res = await fetch(`${API_BASE}/conversations/${currentConversation.id}/export`);
                    const data = await res.json();
                    if (navigator.share) {
                      navigator.share({ title: "Conversation", text: data.export_text });
                    } else {
                      navigator.clipboard.writeText(data.export_text || "");
                      alert("Conversation copied to clipboard");
                    }
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                theme={theme}
                setTheme={setTheme}
              />

              <button
                onClick={() => setAutoscroll((v) => !v)}
                title={autoscroll ? "Auto-scroll: ON" : "Auto-scroll: OFF (click to enable)"}
                className={`p-2 rounded ${autoscroll ? "bg-green-100/60" : "bg-gray-100/40"} hover:scale-105`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* content */}
          <div className="flex-1 min-h-0 relative">
            {!currentConversation ? (
              <EmptyState onCreate={createNewConversation} />
            ) : (
              <div className="h-full flex flex-col">
                <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
                  <div className="mx-auto max-w-4xl">
                    <ChatContainer>
                      {messages.length === 0 && !isTyping && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-300 py-12">No messages yet — start the conversation below.</div>
                      )}

                      {messages.map((m) => {
                        const isOwn = m.role === "user";
                        return (
                          <div key={m.id || m._id} className={`w-full ${isOwn ? "flex justify-end" : "flex justify-start"} py-1`}>
                            <div className="w-full max-w-[78%]">
                              {editingId === m.id ? (
                                <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                                  <input
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="flex-1 p-3 rounded-lg border border-gray-200/30 bg-white/80 dark:bg-gray-800/70"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) saveEditedMessage(m.id, editingText);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                  />
                                  <div className="flex gap-2">
                                    <Button onClick={() => saveEditedMessage(m.id, editingText)}>Save</Button>
                                    <Button onClick={cancelEdit} className="bg-gray-100 dark:bg-gray-800">Cancel</Button>
                                  </div>
                                </div>
                              ) : (
                                <Message
                                  message={m}
                                  isOwn={isOwn}
                                  onCopy={(msg) => copyTextToClipboard(msg.content)}
                                  onEdit={(msg) => startEdit(msg)}
                                  onLike={(msg) => reactMessage(msg.id, "like")}
                                  onDislike={(msg) => reactMessage(msg.id, "dislike")}
                                  onDelete={(msg) => deleteMessage(msg)}
                                  showAvatar
                                  showToolbar
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {isTyping && <div className="py-2"><TypingIndicator agentName={agents[selectedAgent]?.name || "Assistant"} /></div>}

                      <div ref={messagesEndRef} />
                    </ChatContainer>
                  </div>
                </ScrollArea>

                {/* input row */}
                <div className="p-4 border-t border-gray-200/10 bg-white/80 dark:bg-gray-900/70 backdrop-blur-sm">
                  <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <FileUploader onUploadComplete={onFileUploadComplete} />

                    <div className="flex-1">
                      <Input
                        value={editingId ? editingText : inputMessage}
                        onChange={(e) => (editingId ? setEditingText(e.target.value) : setInputMessage(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(editingId || null);
                          } else if (e.key === "Escape" && editingId) {
                            cancelEdit();
                          }
                        }}
                        placeholder={editingId ? "Editing message..." : "Type your message... (Shift+Enter for newline)"}
                        className="w-full"
                        aria-label="Chat input"
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <Button onClick={() => sendMessage(editingId || null)} disabled={isLoading || (!inputMessage && !editingText)}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* floating quick-scroll */}
                <div className="absolute right-6 bottom-24">
                  <button
                    onClick={scrollToBottom}
                    title="Jump to latest"
                    className="p-3 rounded-full bg-white/80 dark:bg-gray-800/60 shadow hover:scale-105"
                  >
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
