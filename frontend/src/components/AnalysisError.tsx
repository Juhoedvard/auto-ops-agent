import { useNavigate } from 'react-router-dom';

interface AnalysisErrorProps {
  error: string;
  cooldown: number;
  onRetry: () => void;
}

export default function AnalysisError({ error, cooldown, onRetry }: AnalysisErrorProps) {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="text-red-400 text-4xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
      <p className="text-slate-400 mb-6">
        {error === 'AI_MODEL_BUSY'
          ? "Gemini is currently at capacity. This is usually temporary."
          : error === 'QUOTA_EXCEEDED'
          ? "Your Gemini API quota has been exhausted for today. Please try again tomorrow."
          : error}
      </p>
      
      {error === 'AI_MODEL_BUSY' ? (
        <button
          onClick={onRetry}
          disabled={cooldown > 0}
          className={`px-8 py-3 rounded-xl font-bold transition-all ${
            cooldown > 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/20'
          }`}
        >
          {cooldown > 0 ? `Retry in ${cooldown}s` : 'Retry Analysis Now'}
        </button>
      ) : (
        <button onClick={() => navigate('/')} className="text-cyan-400 hover:text-cyan-300 hover:underline">
          Try another repository
        </button>
      )}
    </div>
  );
}