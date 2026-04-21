import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { analysisApi } from '../api/analysisApi'; 
import AnalysisStepper from '../components/AnalysisStepper';
import type { AnalysisResult, JobStatus } from '../types/analysis';
import Overview from '../components/AnalysisOverview';
import TechStack from '../components/TechStack';
import AccordionGroup from '../components/AccordionGroup'; 
import YamlConfig from '../components/YamlConfig';
import Benefits from '../components/Benefits';
import ImplementationSteps from '../components/ImplementationSteps';
import DetailedAnalysis from '../components/DetailedAnalysis';
import ChatBox from '../components/ChatBox';
import LoadingButton from '../components/LoadingButton';

export default function Result() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<JobStatus['status']>('cloning');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [activeSection, setActiveSection] = useState<'main' | 'chat'>('main');
  const [cooldown, setCooldown] = useState(0);

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

        if (data.status === 'ready' && data.result) {
          setAnalysis(data.result);
          console.log(data)
          active = false;
        } else if (data.status === 'failed') {
          setError(data.error || 'Analysis failed');
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
  }, [jobId, navigate]);

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
      toast.loading('Retrying analysis...', { id: 'retry' });
      const newJobId = await analysisApi.startAnalysis(savedUrl);
      toast.success('Retry started!', { id: 'retry' });
      navigate(`/result/${newJobId}`);
    } catch (err) {
      toast.error('Failed to restart analysis. AI may still be busy.', { id: 'retry' });
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
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-red-400 text-4xl mb-4">⚠️</div>
                  <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
                  <p className="text-slate-400 mb-6">
                    {error === 'AI_MODEL_BUSY' 
                      ? "Gemini is currently at capacity. This is usually temporary." 
                      : error}
                  </p>
                  
                  {error === 'AI_MODEL_BUSY' ? (
                    <button
                      onClick={handleRetry}
                      disabled={cooldown > 0}
                      className={`px-8 py-3 rounded-xl font-bold transition-all ${
                        cooldown > 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/20'
                      }`}
                    >
                      {cooldown > 0 ? `Retry in ${cooldown}s` : 'Retry Analysis Now'}
                    </button>
                  ) : (
                    <button onClick={() => navigate('/')} className="text-cyan-400 hover:text-cyan-300 hover:underline">Try another repository</button>
                  )}
                </div>
              )}

              {status === 'ready' && analysis && (
                <div className="max-w-4xl mx-auto mt-4 p-6 space-y-6">
                  <h2 className="text-2xl font-bold mb-4 text-slate-100">CI/CD Recommendation</h2>
                  <Overview text={analysis.overview} />
                  <TechStack techs={analysis.tech_stack} />
                  <DetailedAnalysis content={analysis.analysis} />
                  <AccordionGroup data={analysis} />
                  {analysis.yaml_config ? <YamlConfig code={analysis.yaml_config} /> : (
                      <div className="py-12 text-center flex flex-col items-center gap-4">
                          <div className="text-slate-400 text-sm">
                            <span className="text-amber-400/80 block mb-1 font-semibold">No YAML configuration found.</span>
                            <p className="italic opacity-70">The analysis might have skipped this part or failed.</p>
                          </div>
                          
                          <LoadingButton
                            onClick={(e) => {refetchYaml(e)}}
                            loading={isRefetching}
                            loadingText="Regenerating..."
                            className="px-6 py-2 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-cyan-500/25 active:scale-95 border border-cyan-400/20"
                          >
                            <span>↻</span> Refetch YAML
                          </LoadingButton>
                      </div>
                  )}
                  <Benefits benefits={analysis.benefits} />
                  <ImplementationSteps steps={analysis.implementation_steps} />
                </div>
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
