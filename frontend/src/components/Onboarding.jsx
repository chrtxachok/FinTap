// src/components/Onboarding.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ phone: '', inn: '', usn_mode: 'доходы', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingUser, setExistingUser] = useState(null);

  // Проверка существующего пользователя при вводе телефона
  const checkExistingUser = async (phone) => {
    if (phone.length < 10) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      
      if (res.ok) {
        const user = await res.json();
        setExistingUser(user);
      } else {
        setExistingUser(null);
      }
    } catch (err) {
      console.error('Check user error:', err);
    }
  };

  const handlePhoneChange = (value) => {
    const cleanPhone = value.replace(/\D/g, '');
    setForm({...form, phone: cleanPhone});
    checkExistingUser(cleanPhone);
  };

  const handleQuickLogin = async () => {
    if (!existingUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Быстрый вход без SMS - просто сохраняем данные
      localStorage.setItem('userId', existingUser.id);
      localStorage.setItem('usnMode', existingUser.usn_mode);
      localStorage.setItem('userName', existingUser.name || 'Пользователь');
      localStorage.setItem('userINN', existingUser.inn);
      
      navigate('/dashboard');
    } catch (err) {
      setError('Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

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
      localStorage.setItem('userName', user.name || form.name || 'Пользователь');
      localStorage.setItem('userINN', user.inn);
      
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
        <p style={{color: 'var(--text-muted)'}}>
          {existingUser ? 'Быстрый вход' : 'Регистрация за 30 секунд'}
        </p>
      </div>

      {step === 1 && (
        <div className="card flex-col">
          <label className="label">Номер телефона</label>
          <input 
            className="input" 
            type="tel" 
            placeholder="+7 (___) ___-__-__" 
            value={form.phone ? `+7 (${form.phone.slice(1, 4)}) ${form.phone.slice(4, 7)}-${form.phone.slice(7, 9)}-${form.phone.slice(9, 11)}` : ''}
            onChange={e => handlePhoneChange(e.target.value)}
          />
          
          {existingUser ? (
            <>
              <div style={{
                padding: '12px',
                backgroundColor: '#EEF2FF',
                borderRadius: '8px',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                <p style={{margin: 0, fontSize: '14px', color: '#4F46E5'}}>
                  ✅ Аккаунт найден
                </p>
                <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280'}}>
                  {existingUser.name || 'Пользователь'} • ИНН {existingUser.inn}
                </p>
              </div>
              
              <button 
                className="btn" 
                onClick={handleQuickLogin}
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти без SMS'}
              </button>
              
              <button 
                onClick={() => setExistingUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  fontSize: '13px',
                  marginTop: '8px'
                }}
              >
                Зарегистрировать новый аккаунт
              </button>
            </>
          ) : (
            <>
              <label className="label" style={{marginTop: 12}}>Ваше имя (необязательно)</label>
              <input 
                className="input" 
                type="text" 
                placeholder="Аня" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})}
                style={{marginBottom: 12}}
              />
              
              <button 
                className="btn" 
                onClick={() => setStep(2)}
              >
                Далее →
              </button>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="card flex-col">
          <label className="label">Ваша система налогообложения</label>
          <label style={{display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer'}}>
            <input 
              type="radio" 
              name="usn" 
              checked={form.usn_mode === 'доходы'} 
              onChange={() => setForm({...form, usn_mode: 'доходы'})} 
            />
            УСН «Доходы» (6%)
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', marginTop: 8}}>
            <input 
              type="radio" 
              name="usn" 
              checked={form.usn_mode === 'доходы_расходы'} 
              onChange={() => setForm({...form, usn_mode: 'доходы_расходы'})} 
            />
            УСН «Доходы-Расходы» (15%)
          </label>
          
          <label className="label" style={{marginTop: 16}}>ИНН ИП</label>
          <input 
            className="input" 
            type="text" 
            placeholder="12 цифр" 
            maxLength={12}
            value={form.inn} 
            onChange={e => setForm({...form, inn: e.target.value.replace(/\D/g, '')})} 
          />
          
          {error && <p className="error">{error}</p>}
          <button 
            className="btn" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? 'Создаю...' : 'Завершить регистрацию'}
          </button>
          
          <button 
            onClick={() => setStep(1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: 12
            }}
          >
            ← Назад
          </button>
        </div>
      )}
    </div>
  );
}