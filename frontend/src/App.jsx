// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Заглушки для будущих экранов */}
        <Route path="/scanner" element={<div style={{padding: 20}}>📷 Сканер (в разработке)</div>} />
        <Route path="/flags" element={<div style={{padding: 20}}>🔍 ИИ-флаги (в разработке)</div>} />
        <Route path="/taxes" element={<div style={{padding: 20}}>🧾 Налоги (в разработке)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;