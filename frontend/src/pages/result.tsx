import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import { analysisApi, type JobStatus } from '../api/analysisApi'; 
import AnalysisStepper from '../components/AnalysisStepper';

export default function Result() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();


  const [status, setStatus] = useState<JobStatus['status']>('cloning');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState('');
  
  const isPolling = useRef(true);

  // 1. POLLAUS-LOGIIKKA
  useEffect(() => {
    if (!jobId) {
      navigate('/'); 
      return;
    }

    const poll = async () => {
      if (!isPolling.current) return;
      try {
        const data = await analysisApi.checkStatus(jobId);
        setStatus(data.status);

        if (data.status === 'ready') {
          setAnalysis(data.result || '');
          isPolling.current = false;
        } else if (data.status === 'failed') {
          setError(data.error || 'Analysis failed');
          isPolling.current = false;
        } else {
          setTimeout(poll, 2000); 
        }
      } catch (err) {
        setError("Yhteys palvelimeen katkesi.");
        isPolling.current = false;
      }
    };

    poll();
    return () => { isPolling.current = false; };
  }, [jobId, navigate]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    ///Tee myöhemmin
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4 lg:p-8 bg-[#0d1117] text-white">
      <header className="w-full flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="hover:bg-gray-800 p-2 rounded-full transition-colors text-gray-400"
          >
            ←
          </button>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            Auto-CI/CD <span className="text-blue-500">Agent</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-gray-500">ID: {jobId?.slice(0,8)}</span>
          <span className={`${status === 'ready' ? 'text-green-500' : 'text-yellow-500'} uppercase animate-pulse`}>
            ● {status}
          </span>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 h-full flex-1">
        
        <section className="flex-1 min-w-0">
          <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-sm min-h-[400px] lg:h-[85vh] overflow-y-auto">
            
            {status !== 'ready' && !error && (
              <div className="h-full flex flex-col items-center justify-center space-y-8">
                <h2 className="text-xl font-semibold text-gray-300">Processing Repository</h2>
                <AnalysisStepper currentStatus={status} />
              </div>
            )}

            {error && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
                <p className="text-gray-400">{error}</p>
                <button onClick={() => navigate('/')} className="mt-6 text-blue-500 hover:underline">Try another repository</button>
              </div>
            )}

            {status === 'ready' && analysis && (
              <div className="prose prose-invert lg:prose-xl max-w-none">
                <Markdown>{analysis}</Markdown>
              </div>
            )}
          </div>
        </section>

        <aside className="w-full lg:w-96 shrink-0">
          <div className="bg-[#161b22] border border-gray-800 rounded-xl flex flex-col h-[500px] lg:h-[85vh] sticky top-8 shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1c2128] rounded-t-xl">
              <h2 className="font-semibold text-xs uppercase tracking-widest text-gray-400">AI Assistant</h2>
              <span className="flex items-center gap-2 text-[10px] text-green-500 font-mono">
                ONLINE <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="text-center mt-10">
                  <div className="bg-gray-800/50 rounded-lg p-4 mx-4">
                    <p className="text-gray-400 text-xs italic">
                      "Voit kysyä tarkennuksia raporttiin tai pyytää muutoksia YAML-tiedostoon."
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-800 text-gray-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-600 mt-1 px-1 uppercase font-bold">
                    {msg.role === 'user' ? 'Sinä' : 'AI'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-800 bg-[#1c2128] rounded-b-xl">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={status === 'ready' ? "Kirjoita viesti..." : "Wait for analysis..."}
                  disabled={status !== 'ready'}
                  className="flex-1 bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={status !== 'ready' || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}