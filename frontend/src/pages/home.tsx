import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../api';

export default function Home({ setAnalysis }: { setAnalysis: (val: string) => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await chatService.analyzeRepo(url);
      setAnalysis(data.response);
      navigate('/result'); // <--- TÄMÄ siirtää käyttäjän tulossivulle
    } catch (err) {
      alert("Virhe analyysissä");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <h1>Auto-CI/CD 🚀</h1>
      <form onSubmit={handleStart}>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} required />
        <button disabled={loading}>{loading ? "Analysoidaan..." : "Aloita"}</button>
      </form>
    </div>
  );
}