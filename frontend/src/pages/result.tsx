import { useEffect, useState, useRef } from 'react';
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
  const [activeSection, setActiveSection] = useState<'main' | 'chat'>('main');
  const [cooldown, setCooldown] = useState(0);
  const fallbackToastShown = useRef(false);

  // Visual timer for the 'Retry' button when Gemini is at capacity
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  /**
   * Polling Logic:
   * Continually checks the backend status endpoint until the job is 'ready' or 'failed'.
   * Includes basic exponential backoff for network-level consecutive errors.
   */
  useEffect(() => {
    if (!jobId) {
      navigate('/'); 
      return;
    }
    
    // Reset states when navigating to a new jobId (e.g. on retry)
    setError(null);
    setStatus('cloning');

    const MAX_POLL_ATTEMPTS = 120; 
    const POLL_INTERVAL = 2000;
    let active = true;
    let pollCount = 0;
    let consecutiveErrors = 0;
    
    const poll = async () => {
      if (!active || pollCount >= MAX_POLL_ATTEMPTS) {
        if (pollCount >= MAX_POLL_ATTEMPTS) {
          setError("Analysis is taking longer than expected. Please refresh the page or contact support if the issue persists.");
        }
        return;
      }
      
      try {
        const data = await analysisApi.checkStatus(jobId);
        pollCount++;
        consecutiveErrors = 0; 
        setStatus(data.status);

        if (data.fallbackUsed && !fallbackToastShown.current) {
          toast('Gemini is busy. Switched to Groq Llama-70B model.', { icon: '🔄', id: 'fallback-status', duration: 5000 });
          fallbackToastShown.current = true;
        }

        if (data.status === 'ready' && data.result) {
          setAnalysis(data.result);
          console.log(data)
          active = false;
        } else if (data.status === 'failed') {
          setError(data.error || 'Analysis failed');
          if (data.error === 'AI_MODEL_BUSY' && location.state?.isRetry) {
            toast.error("Server is still busy. Please try again later.", {
              id: 'busy-toast',
              position: 'bottom-right',
              duration: 5000,
            });
          }
          active = false;
        } else {
          setTimeout(poll, POLL_INTERVAL); 
        }
      } catch (err: unknown) {
        pollCount++;
        consecutiveErrors++;
        
        
        if (consecutiveErrors < 3) {
          console.warn(`Polling attempt ${pollCount} failed, retrying... (${consecutiveErrors}/3)`, err);
          setTimeout(poll, POLL_INTERVAL);
        } else {
          console.error("Polling failed permanently after consecutive errors:", err);
          setError("Unable to connect to server. Please check your internet connection and try again.");
          active = false;
        }
      }
    };

    poll();
    return () => { active = false; };
  }, [jobId, navigate, location.state?.isRetry]);

  // Calls the backend to regenerate just the YAML if the result was incomplete
  const refetchYaml = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!analysis || isRefetching) return;

    setIsRefetching(true);
    try {
      const result = await analysisApi.handleRegenerateYaml({
        analysis: analysis.analysis,
        overview: analysis.overview,
        jobId: jobId as string
      });

      if (result.fallbackUsed) {
        toast('Gemini is busy. Switched to Groq Llama-70B model.', { icon: '🔄', id: 'fallback-yaml', duration: 4000 });
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
      const newJobId = await analysisApi.startAnalysis(savedUrl);
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
                <AnalysisError error={error} cooldown={cooldown} onRetry={handleRetry} />
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
