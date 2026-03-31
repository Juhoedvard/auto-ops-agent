
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { analysisApi } from '../api/analysisApi';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  console.log(url)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }
    setLoading(true);

    try {
      toast.loading('Starting analysis...', { id: 'analysis' });
      const jobId = await analysisApi.startAnalysis(url);
      toast.success('Analysis started successfully!', { id: 'analysis' });
      navigate(`/result/${jobId}`);
    } catch (err) {
      console.error('Error starting analysis:', err);
      toast.error('Error starting analysis. Please check the URL and try again.', { id: 'analysis' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page bg-linear-to-br from-slate-900 via-blue-900/20 to-indigo-900 min-h-screen text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-r from-cyan-500/5 via-transparent to-purple-500/5 animate-pulse"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl w-full space-y-6 sm:space-y-8"
      >
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight bg-linear-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg"
          >
            Auto-CI/CD <span className="text-blue-500">Agent</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-4 sm:mt-6 text-slate-200 text-base sm:text-lg leading-relaxed"
          >
            Enter your GitHub repository URL and let AI build the pipeline for you.
          </motion.p>
        </div>

        <motion.form
          onSubmit={handleStart}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 sm:mt-8 space-y-4 sm:space-y-6"
        >
          <div className="relative">
            <input
              type="url"
              placeholder="https://github.com/user/repo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-3 sm:px-4 py-3 sm:py-4 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all shadow-xl hover:shadow-cyan-500/10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-3 sm:py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-cyan-500/25 hover:shadow-cyan-400/40 flex items-center justify-center space-x-2 border border-cyan-400/20"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Starting...</span>
              </>
            ) : (
              <>
              <span >Analyze Repository</span>
              </>
            )}
          </button>
        </motion.form>
      </motion.div>
    </div>
  );
}