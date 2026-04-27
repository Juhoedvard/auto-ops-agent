import { useNavigate } from 'react-router-dom';

interface AnalysisErrorProps {
  error: string;
  cooldown: number;
  aiUsed: 'gemini' | 'groq';
  onRetry: () => void;
  onSwitchAndRetry: () => void;
}

export default function AnalysisError({ error, cooldown, aiUsed, onRetry, onSwitchAndRetry }: AnalysisErrorProps) {
  const navigate = useNavigate();

  const isAiError = error === 'AI_MODEL_BUSY' || error === 'QUOTA_EXCEEDED' || error === 'API_KEY_INVALID';
  const alternativeAi = aiUsed === 'gemini' ? 'Groq' : 'Gemini';

  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="text-red-400 text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
      <p className="text-slate-400 mb-6">
        {error === 'AI_MODEL_BUSY'
          ? `${aiUsed === 'gemini' ? 'Gemini' : 'Groq'} is currently at capacity. This is usually temporary.`
          : error === 'QUOTA_EXCEEDED'
          ? `Your ${aiUsed === 'gemini' ? 'Gemini' : 'Groq'} API quota has been exhausted for today. Please try again tomorrow.`
          : error === 'API_KEY_INVALID'
          ? `The API Key for ${aiUsed === 'gemini' ? 'Gemini' : 'Groq'} is invalid or missing.`
          : error}
      </p>
      
      {isAiError ? (
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onRetry}
            disabled={cooldown > 0}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              cooldown > 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {cooldown > 0 ? `Retry in ${cooldown}s` : `Retry with ${aiUsed === 'gemini' ? 'Gemini' : 'Groq'}`}
          </button>
          <button
            onClick={onSwitchAndRetry}
            type="button"
            disabled={cooldown > 0}
            className={`px-6 py-2.5 rounded-lg font-bold shadow-lg transition-all ${
              cooldown > 0 ? 'bg-cyan-900/50 text-cyan-700 cursor-not-allowed shadow-none' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-cyan-500/20'
            }`}
          >
            Switch to {alternativeAi} & Retry
          </button>
        </div>
      ) : (
        <button onClick={() => navigate('/')} className="text-cyan-400 hover:text-cyan-300 hover:underline">
          Try another repository
        </button>
      )}
    </div>
  );
}