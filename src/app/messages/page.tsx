"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { conversations as baseConversations } from "@/lib/social";
import type { Conversation, Message } from "@/lib/social";
import Avatar from "@/components/Avatar";

const lockedConversation: Conversation = {
  userId: "karan-mehta",
  userName: "Karan Mehta",
  userAvatar: "KM",
  username: "@karanmehta",
  lastMessage: "Hold shares to unlock",
  lastTime: "",
  unread: 0,
  sharesHeld: 0,
  messages: [],
};

const allConversations: Conversation[] = [
  ...baseConversations,
  lockedConversation,
];

const messageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(allConversations[0].userId);
  const [showChat, setShowChat] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [localMessages, setLocalMessages] = useState<
    Record<string, Message[]>
  >(() => {
    const initial: Record<string, Message[]> = {};
    allConversations.forEach((c) => {
      initial[c.userId] = [...c.messages];
    });
    return initial;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvo = allConversations.find((c) => c.userId === activeId)!;
  const messages = localMessages[activeId] || [];
  const isLocked = activeConvo.sharesHeld === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const handleSend = () => {
    if (!inputValue.trim() || isLocked) return;
    const newMsg: Message = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMine: true,
    };
    setLocalMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg],
    }));
    setInputValue("");
  };

  const selectConversation = (userId: string) => {
    setActiveId(userId);
    setShowChat(true);
  };

  return (
    <section className="py-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 lg:hidden"
      >
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      </motion.div>

      <div className="grid min-h-[600px] gap-4 lg:grid-cols-3">
        {/* Left Panel — Conversation List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className={`glass-card flex flex-col overflow-hidden ${
            showChat ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="border-b border-card-border p-4">
            <h2 className="text-lg font-bold">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {allConversations.map((convo) => (
              <button
                key={convo.userId}
                onClick={() => selectConversation(convo.userId)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${
                  activeId === convo.userId ? "bg-accent/10" : ""
                }`}
              >
                <div className="relative">
                  <Avatar initials={convo.userAvatar} size="md" />
                  {convo.unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                      {convo.unread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        convo.unread > 0 ? "text-foreground" : "text-foreground"
                      }`}
                    >
                      {convo.userName}
                    </span>
                    {convo.lastTime && (
                      <span className="shrink-0 text-[10px] text-muted">
                        {convo.lastTime}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted">
                    {convo.sharesHeld === 0
                      ? "🔒 Hold shares to unlock"
                      : convo.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Right Panel — Active Chat */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className={`flex flex-col gap-4 lg:col-span-2 ${
            showChat ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Back button (mobile) */}
          <button
            onClick={() => setShowChat(false)}
            className="flex items-center gap-2 text-sm text-muted lg:hidden"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          {/* Chat header */}
          <div className="glass-card flex items-center gap-3 p-4">
            <Avatar initials={activeConvo.userAvatar} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{activeConvo.userName}</p>
              <p className="text-xs text-muted">{activeConvo.username}</p>
            </div>
            {activeConvo.sharesHeld > 0 && (
              <span className="shrink-0 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-light">
                You hold {activeConvo.sharesHeld} shares
              </span>
            )}
          </div>

          {/* Message area or locked state */}
          {isLocked ? (
            <div className="glass-card flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card-border/50">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Hold shares to message</h3>
              <p className="max-w-xs text-sm text-muted">
                Invest in {activeConvo.userName} to unlock direct messaging
              </p>
              <Link
                href={`/trade/${activeConvo.userId}`}
                className="mt-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-light"
              >
                Invest Now
              </Link>
            </div>
          ) : (
            <div className="glass-card flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      custom={i}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          msg.isMine
                            ? "bg-accent text-white"
                            : "border border-card-border bg-card"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            msg.isMine ? "text-white/60" : "text-muted"
                          }`}
                        >
                          {msg.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-card-border p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity disabled:opacity-40"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
