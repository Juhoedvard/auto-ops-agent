import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/home';
import Result from './pages/result';

function App() {
  // Pidetään analyysidata täällä, jotta se säilyy sivujen välillä
  const [analysis, setAnalysis] = useState<string | null>(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<Home setAnalysis={setAnalysis} />} 
        />
        <Route 
          path="/result" 
          element={<Result analysis={analysis} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;