
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisApi } from '../api/analysisApi'; 

export default function Home() { 
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {

      const jobId = await analysisApi.startAnalysis(url);
      console.log(jobId)
      navigate(`/result/${jobId}`); 
      
    } catch (err) {
      alert("Error starting analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page bg-[#0d1117] min-h-screen text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Auto-CI/CD <span className="text-blue-500">Agent</span>
          </h1>
          <p className="mt-4 text-gray-400">Anna GitHub-repositorion URL ja anna tekoälyn rakentaa putki puolestasi.</p>
        </div>

        <form onSubmit={handleStart} className="mt-8 space-y-4">
          <input 
            type="url" 
            placeholder="https://github.com/user/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full bg-[#161b22] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Aloitetaan..." : "Analysoi repository"}
          </button>
        </form>
      </div>
    </div>
  );
}