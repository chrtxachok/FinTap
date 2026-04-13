// src/components/Onboarding.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    usnMode: 'доходы',
    inn: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Шаг 1: Телефон + Имя
  const handleStep1 = () => {
    if (!formData.phone.match(/^\d{10,11}$/)) {
      setError('Введите корректный номер (10-11 цифр)');
      return;
    }
    setError('');
    setStep(2);
  };

  // Шаг 2: Выбор УСН
  const handleStep2 = () => {
    setStep(3);
  };

  // Шаг 3: ИНН → Регистрация
  const handleRegister = async () => {
    if (!formData.inn.match(/^\d{12}$/)) {
      setError('Введите корректный ИНН ИП (12 цифр)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Вызов API бэкенда
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          inn: formData.inn,
          usn_mode: formData.usnMode,
          name: formData.name || 'Пользователь',
          crm_id: null,
          crm_status: 'new'
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка регистрации');
      }
      
      const user = await response.json();
      
      // Сохраняем ID пользователя для последующих запросов
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userINN', user.inn);
      localStorage.setItem('usnMode', user.usn_mode);
      
      console.log('✅ Регистрация успешна:', user);
      navigate('/profile');
      
    } catch (err) {
      console.error('❌ Ошибка регистрации:', err);
      setError(err.message || 'Не удалось создать аккаунт');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header с прогрессом */}
      <div style={styles.header}>
        <h1 style={styles.logo}>💰 ФинТап</h1>
        <div style={styles.progressBar}>
          {[1, 2, 3].map(n => (
            <div 
              key={n} 
              style={{
                ...styles.progressStep,
                backgroundColor: step >= n ? '#4F46E5' : '#E5E7EB'
              }}
            />
          ))}
        </div>
        <p style={styles.progressText}>Шаг {step} из 3</p>
      </div>

      {/* Hero секция */}
      <div style={styles.hero}>
        <h2>Быстрый старт за 30 секунд</h2>
        <p>Без SMS и сложных форм</p>
      </div>

      {/* Форма */}
      <div style={styles.form}>
        {step === 1 && (
          <>
            <label style={styles.label}>Номер телефона</label>
            <input
              type="tel"
              placeholder="+7 (___) ___-__-__"
              value={formData.phone}
              onChange={e => setFormData({
                ...formData, 
                phone: e.target.value.replace(/\D/g, '')
              })}
              style={styles.input}
            />
            
            <label style={styles.label}>Ваше имя (необязательно)</label>
            <input
              type="text"
              placeholder="Аня"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={styles.input}
            />
            
            <button 
              onClick={handleStep1} 
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              Далее →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <label style={styles.label}>Ваша система налогообложения</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="usn"
                  value="доходы"
                  checked={formData.usnMode === 'доходы'}
                  onChange={e => setFormData({...formData, usnMode: e.target.value})}
                />
                <span>УСН «Доходы» (6%)</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="usn"
                  value="доходы_расходы"
                  checked={formData.usnMode === 'доходы_расходы'}
                  onChange={e => setFormData({...formData, usnMode: e.target.value})}
                />
                <span>УСН «Доходы-Расходы» (15%)</span>
              </label>
            </div>
            <p style={styles.hint}>Можно изменить позже в профиле</p>
            <button 
              onClick={handleStep2}
              style={styles.button}
            >
              Далее →
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <label style={styles.label}>ИНН ИП</label>
            <input
              type="text"
              placeholder="12 цифр"
              maxLength={12}
              value={formData.inn}
              onChange={e => setFormData({
                ...formData, 
                inn: e.target.value.replace(/\D/g, '')
              })}
              style={styles.input}
            />
            <p style={styles.hint}>🔐 Данные защищены и не передаются третьим лицам</p>
            <button 
              onClick={handleRegister} 
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? 'Создаю аккаунт...' : 'Завершить регистрацию'}
            </button>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          Регистрируясь, вы принимаете 
          <a href="#" style={styles.link}> условия оферты</a>
        </p>
      </div>
    </div>
  );
}

// Стили
const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '480px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 16px 0',
    color: '#1F2937'
  },
  progressBar: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  progressStep: {
    width: '24px',
    height: '4px',
    borderRadius: '2px',
    transition: 'background-color 0.2s'
  },
  progressText: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0
  },
  hero: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  label: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px'
  },
  button: {
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px'
  },
  buttonDisabled: {
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#A5B4FC',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'not-allowed'
  },
  hint: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '-8px 0 0 0'
  },
  error: {
    color: '#DC2626',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
    backgroundColor: '#FEF2F2',
    padding: '8px',
    borderRadius: '6px'
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '12px',
    color: '#9CA3AF',
    margin: 0
  },
  link: {
    color: '#4F46E5',
    textDecoration: 'none'
  }
};