import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { chatApi } from '../api/chatApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBoxProps {
  contextYaml: string;
  status: string;
}

export default function ChatBox({ contextYaml, status }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);


  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || status !== 'ready' || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
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

    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="bg-[#161b22] border border-gray-800 rounded-xl flex flex-col h-125 lg:h-[85vh] sticky top-8 shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1c2128] rounded-t-xl">
        <h2 className="font-semibold text-xs uppercase tracking-widest text-gray-400">AI Assistant</h2>
        <span className="flex items-center gap-2 text-[10px] text-green-500 font-mono">
          {status === 'ready' ? 'ONLINE' : 'WAITING'} 
          <span className={`w-2 h-2 rounded-full ${status === 'ready' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
        </span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 scrollbar-thin"
      >
        {messages.length === 0 && (
          <div className="text-center mt-10">
            <div className="bg-gray-800/50 rounded-lg p-4 mx-4 border border-gray-700/50 text-gray-400 text-xs italic">
              "You can ask specifics about the analysis, request implementation plans, or seek advice on next steps."
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] px-4 py-2 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none shadow-sm'
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    code({node, className, children, ...props}: any) {
                      const inline = !className
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: '0.5em 0', borderRadius: '4px', fontSize: '11px' }}
                          {...props}
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
              </div>
            </div>
            <span className="text-[10px] text-gray-600 mt-1 px-1 uppercase font-bold">
              {msg.role === 'user' ? 'Sinä' : 'Ops Agent'}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-[#1c2128] rounded-b-xl">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={status === 'ready' ? "Write a message..." : "Wait for analysis..."}
            disabled={status !== 'ready' || isLoading}
            className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50 placeholder-gray-600"
          />
          <button 
            type="submit"
            disabled={status !== 'ready' || !input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 flex items-center justify-center min-w-[64px]"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}