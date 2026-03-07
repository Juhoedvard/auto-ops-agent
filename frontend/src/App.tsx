import { useState } from 'react'
import { chatService } from './api'
import './App.css'

interface Message {
  text: string
  sender: "user" | "agent"
}

function App() {
  const [url, setUrl] = useState<string>('')
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

// VAIHE 1: URL-lähetys
  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const data = await chatService.analyzeRepo(url);
      setAnalysis(data.response); // Tallennetaan AI:n ehdotus
      setMessages([{ text: data.response, sender: 'agent' }]); // Lisätään chattiin
    } catch (err) {
      alert("Yhteys backendiin epäonnistui!");
    } finally {
      setLoading(false);
    }
  };

  // VAIHE 2: Chatti analyysin jälkeen
  const [chatInput, setChatInput] = useState('');
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMsg: Message = { text: chatInput, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setChatInput('');

    try {
      const data = await chatService.sendMessage(chatInput);
      setMessages(prev => [...prev, { text: data.response, sender: 'agent' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Virhe viestissä.", sender: 'agent' }]);
    } finally {
      setLoading(false);
    }
  };

  // --- NÄKYMÄT ---

  // 1. Etusivun näkymä (Input)
  if (!analysis) {
    return (
      <div className="landing-container">
        <h1>Auto-CI/CD Generator 🚀</h1>
        <p>Syötä GitHub-repositorion URL aloittaaksesi</p>
        <form onSubmit={handleStartAnalysis}>
          <input 
            type="url" 
            placeholder="https://github.com/kayttaja/repo" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Analysoidaan..." : "Generoi Putki"}
          </button>
        </form>
      </div>
    );
  }

  // 2. Editori/Chat-näkymä
  return (
    <div className="app-container">
      <div className="sidebar">
        <h3>Ehdotettu CI/CD 📄</h3>
        <pre className="code-block">{analysis}</pre>
      </div>
      <div className="chat-section">
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.sender}`}>{m.text}</div>
          ))}
          {loading && <div>Agentti kirjoittaa...</div>}
        </div>
        <form onSubmit={handleChat}>
          <input 
            value={chatInput} 
            onChange={e => setChatInput(e.target.value)}
            placeholder="Kysy muutoksia..."
          />
          <button type="submit" disabled={loading}>Lähetä</button>
        </form>
      </div>
    </div>
  );
}

export default App;