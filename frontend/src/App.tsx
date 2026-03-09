import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Result from './pages/result';

function App() {
  return (

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result/:jobId" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;