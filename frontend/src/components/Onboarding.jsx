// src/components/Onboarding.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ phone: '', inn: '', usn_mode: 'доходы', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.phone.match(/^\d{10,11}$/) || !form.inn.match(/^\d{12}$/)) {
      setError('Проверьте телефон (10-11 цифр) и ИНН (12 цифр)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) throw new Error('Ошибка регистрации');
      const user = await res.json();
      
      localStorage.setItem('userId', user.id);
      localStorage.setItem('usnMode', user.usn_mode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="text-center" style={{marginBottom: 32}}>
        <h1 style={{fontSize: 24, fontWeight: 700}}>💰 ФинТап</h1>
        <p style={{color: 'var(--text-muted)'}}>Регистрация за 30 секунд</p>
      </div>

      {step === 1 && (
        <div className="card flex-col">
          <label className="label">Номер телефона</label>
          <input className="input" type="tel" placeholder="+7 (___) ___-__-__" 
            value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '')})} />
          
          <label className="label">Ваше имя (необязательно)</label>
          <input className="input" type="text" placeholder="Аня" 
            value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          
          <button className="btn" onClick={() => setStep(2)}>Далее →</button>
        </div>
      )}

      {step === 2 && (
        <div className="card flex-col">
          <label className="label">Ваша система налогообложения</label>
          <label style={{display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer'}}>
            <input type="radio" name="usn" checked={form.usn_mode === 'доходы'} onChange={() => setForm({...form, usn_mode: 'доходы'})} />
            УСН «Доходы» (6%)
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer'}}>
            <input type="radio" name="usn" checked={form.usn_mode === 'доходы_расходы'} onChange={() => setForm({...form, usn_mode: 'доходы_расходы'})} />
            УСН «Доходы-Расходы» (15%)
          </label>
          
          <label className="label mt-4">ИНН ИП</label>
          <input className="input" type="text" placeholder="12 цифр" maxLength={12}
            value={form.inn} onChange={e => setForm({...form, inn: e.target.value.replace(/\D/g, '')})} />
          
          {error && <p className="error">{error}</p>}
          <button className="btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Создаю...' : 'Завершить регистрацию'}
          </button>
        </div>
      )}
    </div>
  );
}