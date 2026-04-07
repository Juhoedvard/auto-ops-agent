import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { chatApi } from '../api/chatApi';
import ErrorBoundary from './ErrorBoundary';import LoadingButton from './LoadingButton';
interface Message {
  role: 'user' | 'assistant';
  content: string;
  failed?: boolean;
  retrying?: boolean;
}

interface ChatBoxProps {
  contextYaml: string;
  status: string;
  onChatActivity?: () => void;
  onMessagesChange?: (hasMessages: boolean) => void;
  isActive?: boolean;
}

export default function ChatBox({ contextYaml, status, onChatActivity, onMessagesChange, isActive = false }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Notify parent when messages change
  useEffect(() => {
    onMessagesChange?.(messages.length > 0);
  }, [messages.length, onMessagesChange]);


  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || status !== 'ready' || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    onChatActivity?.(); // Notify parent of chat activity
    setIsLoading(true);

    try {

      const reply = await chatApi.sendMessage({
        message: userMessage,
        context: contextYaml,
        history: messages.map(m => ({
          role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          parts: [{ text: m.content }]
        })).slice(-10)
      });


      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(errorMessage);
      // Mark the last assistant message as failed
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.failed = true;
        } else {
          // If no assistant message exists, add a failed placeholder
          newMessages.push({ role: 'assistant', content: '', failed: true });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryMessage = async (messageIndex: number) => {
    const messageToRetry = messages[messageIndex - 1]; // Get the user message before this assistant message
    if (!messageToRetry || messageToRetry.role !== 'user') return;

    // Mark as retrying
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, retrying: true, failed: false } : msg
    ));

    try {
      const reply = await chatApi.sendMessage({
        message: messageToRetry.content,
        context: contextYaml,
        history: messages.slice(0, messageIndex).map(m => ({
          role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
          parts: [{ text: m.content }]
        })).slice(-10)
      });

      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { role: 'assistant', content: reply, failed: false, retrying: false } : msg
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed. Please try again.';
      toast.error(errorMessage);
      setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { ...msg, failed: true, retrying: false } : msg
      ));
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl flex flex-col h-125 lg:h-[85vh] sticky top-8 shadow-2xl overflow-hidden transition-all duration-300 ${
        isActive 
          ? 'border-cyan-400/50 shadow-cyan-400/10' 
          : 'border-slate-700/50'
      }`}
    >
      <div className="p-3 sm:p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80 backdrop-blur-sm rounded-t-xl">
        <h2 className="font-semibold text-xs uppercase tracking-widest text-slate-400">AI Assistant</h2>
        <span className="flex items-center gap-2 text-[10px] font-mono">
          <span className={`${status === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {status === 'ready' ? 'ONLINE' : 'WAITING'}
          </span>
          <span className={`w-2 h-2 rounded-full ${status === 'ready' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col gap-3 sm:gap-4 scrollbar-thin"
      >
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="text-center mt-8 sm:mt-10"
            >
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 mx-2 sm:mx-4 border border-slate-600/30 text-slate-300 text-xs sm:text-sm italic">
                "You can ask specifics about the analysis, request implementation plans, or seek advice on next steps."
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[90%] px-3 sm:px-4 py-2 sm:py-3 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-white rounded-tr-none shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-700/50 backdrop-blur-sm text-slate-200 border border-slate-600/50 rounded-tl-none shadow-sm'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ErrorBoundary>
                    <ReactMarkdown
                      components={{
                        code({  className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) {
                          const inline = !className
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus as Record<string, React.CSSProperties>}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ margin: '0.5em 0', borderRadius: '4px', fontSize: '11px' }}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-gray-700 px-1 rounded text-blue-300" {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </ErrorBoundary>
                </div>
                {msg.failed && msg.role === 'assistant' && (
                  <button
                    onClick={() => retryMessage(index)}
                    disabled={msg.retrying}
                    className="mt-2 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-md border border-red-600/30 hover:border-red-500/50 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {msg.retrying ? (
                      <>
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Retrying...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </>
                    )}
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1 uppercase font-bold">
                {msg.role === 'user' ? 'You' : 'Ops Agent'}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-start"
            >
              <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-slate-700/50 bg-slate-800/80 backdrop-blur-sm rounded-b-xl">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => onChatActivity?.()}
            placeholder={status === 'ready' ? "Write a message..." : "Wait for analysis..."}
            disabled={status !== 'ready' || isLoading}
            className="flex-1 bg-slate-900/50 backdrop-blur-sm border border-slate-600/50 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50 placeholder-slate-500"
          />
          <LoadingButton
            type="submit"
            loading={isLoading}
            loadingText="..."
            disabled={status !== 'ready' || !input.trim()}
            className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm font-semibold shadow-lg shadow-cyan-500/25 min-w-[60px] sm:min-w-[64px]"
          >
            Send
          </LoadingButton>
        </form>
      </div>
    </motion.div>
  );
}