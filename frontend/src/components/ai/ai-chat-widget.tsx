'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, RotateCcw, Bot, User, ShoppingBag, ArrowRight } from 'lucide-react';
import { aiApi } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export interface AiProductVariant {
  id: string;
  size: string;
  stock: number;
  price: number;
}

export interface AiProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  imageUrl: string;
  categoryName?: string;
  variants: AiProductVariant[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: AiProduct[];
}

const QUICK_REPLIES = [
  'Show me latest kurtis',
  'Do you have sarees?',
  'What is your return policy?',
  'How do I place an order?',
];

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! 👗 I'm your K D A assistant. Ask me to find any clothing, pick your size, and I can take you straight to checkout to place your order!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const router = useRouter();

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
      const response: any = isAuthenticated
        ? await aiApi.chat(text, sessionId)
        : await aiApi.guestChat(text, sessionId);

      const aiMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data?.message || "Here are the best matches for you:",
        timestamp: new Date(),
        products: response.data?.products || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again or contact us at support@kda.in 😊",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderFromAi = (product: AiProduct) => {
    const availableSizes = Array.from(new Set(product.variants?.map((v) => v.size).filter(Boolean))) || [];
    const chosenSize = selectedSizes[product.id] || availableSizes[0] || 'Free Size';
    const chosenVariant = product.variants?.find((v) => v.size === chosenSize) || product.variants?.[0];

    addItem({
      productId: product.id,
      variantId: chosenVariant?.id,
      name: product.name,
      image: product.imageUrl,
      price: chosenVariant?.price || product.salePrice || product.basePrice,
      quantity: 1,
      size: chosenSize,
      slug: product.slug,
    });

    toast.success(`Selected ${product.name} (${chosenSize})! Taking you to checkout...`);
    setIsOpen(false);
    router.push('/checkout');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const resetChat = () => {
    setMessages([{
      id: uuidv4(),
      role: 'assistant',
      content: "Hello! 👗 I'm your K D A assistant. How can I help you today?",
      timestamp: new Date(),
    }]);
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-[400px]"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">K D A Assistant</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-white/80 text-xs">Online · Instant Order Ready</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={resetChat} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-white" title="Reset chat">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 md:h-[420px] overflow-y-auto p-4 space-y-3 bg-gray-50 flex-1">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`flex gap-2 max-w-[92%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-gray-700 to-gray-900'
                      }`}>
                        {msg.role === 'user'
                          ? <User className="h-3.5 w-3.5 text-white" />
                          : <Bot className="h-3.5 w-3.5 text-white" />
                        }
                      </div>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-tr-sm'
                            : 'bg-white text-gray-700 shadow-sm rounded-tl-sm border border-gray-100'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>'),
                        }}
                      />
                    </div>

                    {/* Matched Products with Size Selection and Direct Order Placement */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-2.5 w-full pl-9 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-md w-fit">
                          <ShoppingBag className="h-3 w-3" />
                          <span>Select size & order directly:</span>
                        </div>

                        <div className="space-y-2">
                          {msg.products.map((p) => {
                            const availableSizes = Array.from(new Set(p.variants?.map((v) => v.size).filter(Boolean))) || [];
                            const currentSize = selectedSizes[p.id] || availableSizes[0] || 'Free Size';
                            const displayPrice = p.salePrice || p.basePrice;

                            return (
                              <div
                                key={p.id}
                                className="bg-white rounded-xl border border-gray-200 hover:border-purple-300 shadow-xs p-2.5 text-left transition-all space-y-2"
                              >
                                <div className="flex gap-2.5 items-center">
                                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                                    <img
                                      src={p.imageUrl}
                                      alt={p.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1583391733959-f18305881477?w=400&q=80';
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-xs font-black text-gray-900">
                                        ₹{Number(displayPrice).toLocaleString('en-IN')}
                                      </span>
                                      {p.salePrice && p.basePrice > p.salePrice && (
                                        <span className="text-[10px] text-gray-400 line-through">
                                          ₹{Number(p.basePrice).toLocaleString('en-IN')}
                                        </span>
                                      )}
                                    </div>
                                    {p.categoryName && (
                                      <span className="text-[9px] text-purple-600 font-medium uppercase tracking-wide">
                                        {p.categoryName}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Sizes */}
                                {availableSizes.length > 0 && (
                                  <div className="pt-1.5 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-1 text-[10px]">
                                      <span className="text-gray-500">Pick Size:</span>
                                      <span className="font-bold text-purple-700">{currentSize}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {availableSizes.map((sz) => (
                                        <button
                                          key={sz}
                                          type="button"
                                          onClick={() => setSelectedSizes((prev) => ({ ...prev, [p.id]: sz }))}
                                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all border ${
                                            currentSize === sz
                                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                          }`}
                                        >
                                          {sz}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOrderFromAi(p)}
                                    className="flex-1 py-1.5 px-2.5 bg-black hover:bg-gray-800 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
                                  >
                                    <span>Place Order ({currentSize})</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsOpen(false);
                                      router.push(`/products/${p.slug}`);
                                    }}
                                    className="py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-medium rounded-lg"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {messages.length <= 1 && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-1.5 flex-shrink-0">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => sendMessage(reply)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 transition-all font-medium"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-100 bg-white flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask or search: 'red saree', 'white kurti'..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 bg-gray-50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-white"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>
    </>
  );
}
