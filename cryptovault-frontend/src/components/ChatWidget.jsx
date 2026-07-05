import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, RotateCcw, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../api/chatbot';

const STARTERS = ['What is Bitcoin?', "What's trending today?", 'How do I enable 2FA?', 'Explain DeFi'];

/** Lightweight markdown-ish rendering: bold, code, lists */
function BotMessage({ text }) {
  if (!text) return null;

  // Split into lines and process
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    // Code block detection
    if (line.startsWith('```')) return;

    // Bullet points
    if (line.match(/^[*\-•]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 items-start">
          <span className="text-mint mt-0.5 shrink-0">•</span>
          <span>{renderInline(line.replace(/^[*\-•]\s/, ''))}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} className="flex gap-2 items-start">
          <span className="text-mint shrink-0 font-mono text-[11px] mt-0.5">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
      return;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />);
      return;
    }

    // Regular paragraph
    elements.push(<p key={i}>{renderInline(line)}</p>);
  });

  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text) {
  // Bold **text** and __text__
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('__') && part.endsWith('__')) {
      return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    }
    // Inline code `code`
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return (
          <code key={`${i}-${j}`} className="px-1.5 py-0.5 rounded bg-void-700 text-mint text-[11px] font-mono">
            {cp.slice(1, -1)}
          </code>
        );
      }
      return cp;
    });
  });
}

function timeStamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Hi, I'm the CryptoVault assistant. Ask me about any coin, market trends, or how the platform works.",
      time: timeStamp(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, open, loading, scrollToBottom]);

  const send = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || loading) return;
    const userMsg = { role: 'user', text: prompt, time: timeStamp() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await sendChatMessage(prompt);
      setMessages((m) => [...m, { role: 'bot', text: reply, time: timeStamp() }]);
    } catch (err) {
      let msg = err.friendlyMessage || 'The assistant is unavailable right now. Please try again.';
      if (
        msg.includes('AbstractMethodError') ||
        msg.includes('java.lang') ||
        msg.includes('dispatch failed') ||
        msg.includes('Handler dispatch') ||
        msg.includes('500')
      ) {
        msg = 'The chatbot service encountered an internal error. Please verify the backend configurations and try again.';
      }
      setMessages((m) => [...m, { role: 'bot', text: msg, isError: true, time: timeStamp() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    // Find last user message and retry it
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      // Remove the error message
      setMessages((m) => {
        const last = m[m.length - 1];
        return last?.isError ? m.slice(0, -1) : m;
      });
      send(lastUser.text);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-5 z-[95] w-[90vw] max-w-sm h-[32rem] rounded-2xl border border-white/10 bg-void-800/98 backdrop-blur-xl shadow-panel-lg flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-void-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-mint/20 to-violet-600/20 text-mint flex items-center justify-center">
                  <Sparkles size={15} />
                </div>
                <div>
                  <span className="font-display text-sm font-semibold text-ink block leading-none">AI Assistant</span>
                  <span className="text-[10px] text-mint font-mono">● Online</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[88%]">
                    {m.role === 'bot' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Bot size={11} className="text-violet-400" />
                        <span className="text-[10px] text-ink-faint">CryptoVault AI</span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-mint text-void font-medium rounded-br-md'
                          : m.isError
                          ? 'bg-carmine/10 border border-carmine/20 text-carmine rounded-bl-md'
                          : 'bg-white/[0.05] border border-white/[0.06] text-ink-muted rounded-bl-md'
                      }`}
                    >
                      {m.role === 'bot' && !m.isError ? <BotMessage text={m.text} /> : m.text}
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] text-ink-faint font-mono">{m.time}</span>
                      {m.isError && (
                        <button onClick={handleRetry} className="text-[10px] text-carmine hover:text-carmine-400 flex items-center gap-1">
                          <RotateCcw size={9} /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Starter suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-white/10 text-ink-muted hover:text-ink hover:bg-white/[0.05] hover:border-mint/20 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 p-3 border-t border-white/[0.06] bg-void-900/30"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a coin or the platform…"
                className="flex-1 rounded-xl border border-white/10 bg-void-900/60 px-4 py-2.5 text-sm text-ink outline-none focus:border-mint/50 placeholder:text-ink-faint transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 shrink-0 rounded-xl bg-mint text-void flex items-center justify-center hover:bg-mint-400 transition-all disabled:opacity-40 shadow-mint-sm"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[95] w-14 h-14 rounded-2xl bg-gradient-to-br from-mint to-mint-600 text-void flex items-center justify-center shadow-mint hover:shadow-mint-lg transition-all group"
        aria-label="Open assistant"
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </motion.div>
        {!open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-mint animate-ping opacity-50" />
        )}
      </motion.button>
    </>
  );
}
