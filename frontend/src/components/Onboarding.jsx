// src/components/Onboarding.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    smsCode: '',
    usnMode: 'доходы',
    inn: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Шаг 1: Ввод телефона
  const handleSendSMS = async () => {
    if (!formData.phone.match(/^\d{11}$/)) {
      setError('Введите корректный номер телефона');
      return;
    }
    setLoading(true);
    try {
      // TODO: Заменить на реальный API вызов
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep(2);
      setError('');
    } catch (err) {
      setError('Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: Подтверждение SMS
  const handleVerifySMS = async () => {
    if (formData.smsCode.length !== 4) {
      setError('Введите 4-значный код');
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep(3);
      setError('');
    } catch (err) {
      setError('Неверный код');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 3: Выбор УСН
  const handleSelectUSN = () => {
    setStep(4);
  };

  // Шаг 4: Ввод ИНН → Регистрация
  const handleRegister = async () => {
    if (!formData.inn.match(/^\d{12}$/)) {
      setError('Введите корректный ИНН (12 цифр)');
      return;
    }
    setLoading(true);
    try {
      // TODO: Реальный вызов API
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          inn: formData.inn,
          usn_mode: formData.usnMode,
          crm_id: null // ПР-08: поле для интеграции с CRM
        })
      });
      
      if (!response.ok) throw new Error('Ошибка регистрации');
      
      const user = await response.json();
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userINN', user.inn);
      navigate('/profile');
    } catch (err) {
      setError('Не удалось создать аккаунт');
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
          {[1, 2, 3, 4].map(n => (
            <div 
              key={n} 
              style={{
                ...styles.progressStep,
                backgroundColor: step >= n ? '#4F46E5' : '#E5E7EB'
              }}
            />
          ))}
        </div>
        <p style={styles.progressText}>Шаг {step} из 4</p>
      </div>

      {/* Hero секция */}
      <div style={styles.hero}>
        <h2>Учёт для селлеров за 2 минуты</h2>
        <p>WB • Ozon • Тинькофф • Сбер</p>
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
              onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
              style={styles.input}
            />
            <button 
              onClick={handleSendSMS} 
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <label style={styles.label}>Код из SMS</label>
            <input
              type="text"
              placeholder="____"
              maxLength={4}
              value={formData.smsCode}
              onChange={e => setFormData({...formData, smsCode: e.target.value.replace(/\D/g, '')})}
              style={styles.input}
            />
            <button 
              onClick={handleVerifySMS} 
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>
          </>
        )}

        {step === 3 && (
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
            <button 
              onClick={handleSelectUSN}
              style={styles.button}
            >
              Далее
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <label style={styles.label}>ИНН ИП</label>
            <input
              type="text"
              placeholder="12 цифр"
              maxLength={12}
              value={formData.inn}
              onChange={e => setFormData({...formData, inn: e.target.value.replace(/\D/g, '')})}
              style={styles.input}
            />
            <p style={styles.hint}>Проверяем через ФНС API 🔐</p>
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
    </div>
  );
}

// Стили (можно вынести в App.css)
const styles = {
  container: {
    minHeight: '100vh',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '480px',
    margin: '0 auto'
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
    transition: 'background-color 0.2s'
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
    textAlign: 'center'
  }
};