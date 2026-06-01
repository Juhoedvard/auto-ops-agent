import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { analysisApi } from '../api/analysisApi'; 
import AnalysisStepper from '../components/AnalysisStepper';
import type { AnalysisResult, JobStatus } from '../types/analysis';
import AnalysisReport from '../components/AnalysisReport';
import AnalysisError from '../components/AnalysisError';
import ChatBox from '../components/ChatBox';

export default function Result() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState<JobStatus['status']>('cloning');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [aiUsed, setAiUsed] = useState<'gemini' | 'groq'>('gemini');
  const [activeSection, setActiveSection] = useState<'main' | 'chat'>('main');
  const [cooldown, setCooldown] = useState(0);
  const [fallbackPolling, setFallbackPolling] = useState(false);
  const fallbackToastShown = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Visual timer for the 'Retry' button when Gemini is at capacity
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (!jobId) {
      navigate('/');
      return;
    }

    setError(null);
    setStatus('cloning');
    setFallbackPolling(false);
    fallbackToastShown.current = false;

    const connection = analysisApi.subscribeJobStatus(jobId, {
      onOpen: () => {
        console.log(`WebSocket connected for job ${jobId}`);
        setFallbackPolling(false);
      },
      onMessage: (data) => {
        if (!data || typeof data !== 'object') {
          return;
        }

        const payload = data as Partial<JobStatus> & { type?: string };

        if (payload.type === 'status' || payload.status) {
          const currentStatus = payload.status as JobStatus['status'];
          setStatus(currentStatus);
          if (payload.aiUsed) {
            setAiUsed(payload.aiUsed as 'gemini' | 'groq');
          }

          if (currentStatus === 'ready' && payload.result) {
            setAnalysis(payload.result as AnalysisResult);
          }

          if (currentStatus === 'failed') {
            setError((payload.error as string) || 'Analysis failed');
            if ((payload.error as string) === 'AI_MODEL_BUSY' && location.state?.isRetry) {
              toast.error('Server is still busy. Please try again later.', {
                id: 'busy-toast',
                position: 'bottom-right',
                duration: 5000,
              });
            }
          }
        }
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        setFallbackPolling(true);
        if (!socketRef.current) {
          setError('Real-time connection failed. Falling back to status polling.');
        }
      },
      onClose: () => {
        console.log(`WebSocket closed for job ${jobId}`);
        setFallbackPolling(true);
      },
    });

    socketRef.current = connection.socket;

    return () => {
      connection.close();
      socketRef.current = null;
    };
  }, [jobId, navigate, location.state?.isRetry]);

  const refreshJobStatus = useCallback(async () => {
    if (!jobId || status === 'ready' || status === 'failed') {
      return;
    }

    try {
      const data = await analysisApi.checkStatus(jobId);
      setStatus(data.status);
      if (data.aiUsed) {
        setAiUsed(data.aiUsed);
      }

      if (data.status === 'ready' && data.result) {
        setAnalysis(data.result);
      }

      if (data.status === 'failed') {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Fallback polling failed:', err);
    }
  }, [jobId, status]);

  useEffect(() => {
    if (!fallbackPolling || !jobId || status === 'ready' || status === 'failed') {
      return;
    }

    refreshJobStatus();
    pollingRef.current = setInterval(refreshJobStatus, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fallbackPolling, refreshJobStatus]);

  // Calls the backend to regenerate just the YAML if the result was incomplete
  const refetchYaml = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!analysis || isRefetching) return;

    setIsRefetching(true);
    try {
      const result = await analysisApi.handleRegenerateYaml({
        analysis: analysis.analysis,
        overview: analysis.overview,
        jobId: jobId as string,
        ai: aiUsed
      });

      if (result.aiUsed === 'groq') {
        toast('Using Groq Llama-70B model.', { icon: '🔄', id: 'fallback-yaml', duration: 4000 });
      }

      setAnalysis({
        ...analysis,
        yaml_config: result.yaml 
      });
      toast.success('YAML configuration regenerated successfully!', { duration: 3000 });
    } catch (err: unknown) {
      console.error("Failed to refetch YAML:", err);
      toast.error('Failed to regenerate YAML. Please try again.', { duration: 4000 });
    } finally {
      setIsRefetching(false);
    }
  }

  // Triggered manually when the AI returns 'AI_MODEL_BUSY'
  const handleRetry = async () => {
    const savedUrl = localStorage.getItem('pending_repo_url');
    if (!savedUrl) {
      toast.error("No repository URL found to retry.");
      return;
    }

    setCooldown(15);
    try {
      const newJobId = await analysisApi.startAnalysis({ url: savedUrl, ai: aiUsed });
      navigate(`/result/${newJobId}`, { state: { isRetry: true } });
    } catch (err: unknown) {
      console.error("Retry failed:", err);
      toast.error('Failed to connect to server. Please try again later.');
    }
  };

  // Triggered when the user decides to switch the AI and immediately retry
  const handleSwitchAndRetry = async () => {
    const savedUrl = localStorage.getItem('pending_repo_url');
    if (!savedUrl) {
      toast.error("No repository URL found to retry.");
      return;
    }

    const targetAi = aiUsed === 'gemini' ? 'groq' : 'gemini';
    setCooldown(15);
    try {
      const newJobId = await analysisApi.startAnalysis({ url: savedUrl, ai: targetAi });
      navigate(`/result/${newJobId}`, { state: { isRetry: true } });
    } catch (err: unknown) {
      console.error("Retry failed:", err);
      toast.error('Failed to connect to server. Please try again later.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full p-4 lg:p-8 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="w-full flex items-center justify-between mb-8 border-b border-slate-700/50 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="hover:bg-slate-700/50 p-2 rounded-full transition-colors text-slate-400 hover:text-cyan-400"
          >
            ←
          </button>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            Auto-CI/CD <span className="text-cyan-400">Agent</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-slate-500">ID: {jobId?.slice(0,8)}</span>
          <span className={`${status === 'ready' ? 'text-emerald-400' : 'text-amber-400'} uppercase animate-pulse`}>
            ● {status}
          </span>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full flex-1 transition-all duration-300">
        
        <motion.section
          layout
          className={`min-w-0 transition-all duration-300 ${
            activeSection === 'main' 
              ? 'flex-3 lg:flex-4' 
              : 'flex-1'
          }`}
          onClick={() => setActiveSection('main')}
          onFocus={() => setActiveSection('main')}
          onScroll={() => setActiveSection('main')}
        >
          <div 
            className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl shadow-sm min-h-100 lg:h-[85vh] transition-all duration-300  ${
              activeSection === 'main' 
                ? 'border-cyan-400/50 shadow-cyan-400/10' 
                : 'border-slate-700/50'
            } p-4 sm:p-6 md:p-8`}
          >
            <div className="overflow-y-auto h-full">
              {/* All content inside this scrollable wrapper */}
              {status !== 'ready' && !error && (
                <div className="h-full flex flex-col items-center justify-center space-y-8">
                  <h2 className="text-xl font-semibold text-slate-200">Processing Repository</h2>
                  <AnalysisStepper currentStatus={status} />
                </div>
              )}

              {error && (
                <AnalysisError error={error} cooldown={cooldown} aiUsed={aiUsed} onRetry={handleRetry} onSwitchAndRetry={handleSwitchAndRetry} />
              )}

              {status === 'ready' && analysis && (
                <AnalysisReport analysis={analysis} isRefetching={isRefetching} onRefetchYaml={refetchYaml} />
              )}
            </div>
          </div>
        </motion.section>
       {analysis &&(
        <motion.aside
          layout
          className={`shrink-0 transition-all duration-300 ${
            activeSection === 'chat' 
              ? 'w-full lg:w-150 xl:w-175' 
              : 'w-full lg:w-64 xl:w-72'
          }`}
          onClick={() => setActiveSection('chat')}
          onFocus={() => setActiveSection('chat')}
        >

            <ChatBox 
              contextYaml={analysis.yaml_config}
              status={status} 
              onChatActivity={() => setActiveSection('chat')}
              onMessagesChange={(hasMessages) => {
                if (hasMessages && activeSection === 'main') {
                  setActiveSection('chat');
                }
              }}
              isActive={activeSection === 'chat'}
            />
        </motion.aside>
        )}

      </main>
    </div>
  );
}
