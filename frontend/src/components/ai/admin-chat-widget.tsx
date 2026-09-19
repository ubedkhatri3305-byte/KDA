'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Bot, User, Zap } from 'lucide-react';
import { aiApi } from '@/services/api';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ADMIN_QUICK_REPLIES = [
  'How many orders today?',
  'What is my total revenue?',
  'How many pending orders?',
  'Show recent orders summary',
  'How many active products?',
  'Any business suggestions?',
];

export function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi Admin! I\'m your **K D A AI Assistant**. I have access to your live store data — orders, revenue, customers, and more.\n\nAsk me anything like:\n- "How many orders today?"\n- "What\'s my total revenue?"\n- "Any pending orders to review?"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response: any = await aiApi.adminChat(text, sessionId);
      const aiMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data?.message || 'I had trouble fetching that. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "⚠️ I'm having trouble connecting. Please check your session or try refreshing.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const resetChat = () => {
    setMessages([{
      id: uuidv4(),
      role: 'assistant',
      content: '🔄 Chat reset! Ask me anything about your store data.',
      timestamp: new Date(),
    }]);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 sm:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-4 sm:bottom-6 right-2 sm:right-4 md:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-[400px]"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                      <Zap className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">Store AI Assistant</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-white/70 text-xs">Live store data · Admin only</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={resetChat} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all" title="Reset chat">
                      <RotateCcw className="h-3.5 w-3.5 text-white" />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                      <X className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user'
                        ? 'bg-gray-900'
                        : 'bg-gradient-to-br from-yellow-500 to-orange-500'
                    }`}>
                      {msg.role === 'user'
                        ? <User className="h-3.5 w-3.5 text-white" />
                        : <Zap className="h-3.5 w-3.5 text-white" />
                      }
                    </div>
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gray-900 text-white rounded-tr-sm'
                          : 'bg-white text-gray-700 shadow-sm rounded-tl-sm border border-gray-100'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>'),
                      }}
                    />
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                      <div className="flex gap-1 items-center">
                        <span className="text-xs text-gray-400 mr-1">Fetching store data</span>
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {messages.length <= 1 && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick Questions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ADMIN_QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => sendMessage(reply)}
                        className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-100 bg-white">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about orders, revenue, customers..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 bg-gray-50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button (shown only when chat is closed to avoid any overlap) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="admin-chat-floating-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-2xl bg-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open Admin AI Assistant"
          >
            <Zap className="h-6 w-6 text-yellow-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
