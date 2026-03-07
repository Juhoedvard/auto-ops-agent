import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

export default function Result({ analysis }: { analysis: string | null }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!analysis) navigate('/'); // Suojaus: Jos ei dataa, takaisin kotiin
  }, [analysis, navigate]);

  if (!analysis) return null;

  return (
    <div className="result-page">
      <nav>
        <button onClick={() => navigate('/')}>← Uusi analyysi</button>
      </nav>
      <div className="content">
        <Markdown>{analysis}</Markdown>
      </div>
      {/* Tähän voit lisätä sen aiemman chat-komponentin */}
    </div>
  );
}