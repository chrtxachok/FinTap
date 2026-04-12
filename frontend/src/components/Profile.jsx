// src/components/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  
  const [connections, setConnections] = useState({
    bank: false,
    wb: false,
    ozon: false
  });
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState({ wb: '', ozon: '' });

  // Загрузка существующих подключений
  useEffect(() => {
    const loadConnections = async () => {
      if (!userId) return;
      try {
        // TODO: Реальный API вызов
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/accounts/${userId}`);
        if (response.ok) {
          const accounts = await response.json();
          setConnections(prev => ({
            ...prev,
            bank: accounts.some(a => a.type === 'checking')
          }));
        }
      } catch (err) {
        console.log('Нет подключённых счетов');
      }
    };
    loadConnections();
  }, [userId]);

  const handleConnectBank = async (bankName) => {
    setLoading(true);
    try {
      // TODO: Интеграция с банком через OAuth/QR
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Сохраняем подключение
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          bank_name: bankName,
          account_number: '40802810...', // TODO: получить из банка
          type: 'checking',
          crm_synced: false // ПР-08: поле для CRM
        })
      });
      
      setConnections(prev => ({ ...prev, bank: true }));
    } catch (err) {
      alert('Не удалось подключить банк');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMarketplace = async (mp) => {
    const key = apiKeys[mp];
    if (!key || key.length < 10) {
      alert('Введите корректный API-ключ');
      return;
    }
    
    setLoading(true);
    try {
      // TODO: Валидация ключа через API маркетплейса
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnections(prev => ({ ...prev, [mp]: true }));
      setApiKeys(prev => ({ ...prev, [mp]: '' }));
    } catch (err) {
      alert('Неверный API-ключ');
    } finally {
      setLoading(false);
    }
  };

  const isReady = connections.bank || connections.wb || connections.ozon;

  const handleFinish = () => {
    if (!isReady) {
      if (window.confirm('⚠️ Без подключений приложение не сможет синхронизировать данные. Продолжить?')) {
        navigate('/dashboard');
      }
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>←</button>
        <h1>Профиль и подключения</h1>
      </div>

      {/* Статус подключения */}
      <div style={styles.statusBlock}>
        <ConnectionStatus label="Телефон" done />
        <ConnectionStatus label="ИНН" done />
        <ConnectionStatus label="Банк" done={connections.bank} />
        <ConnectionStatus label="Маркетплейс" done={connections.wb || connections.ozon} />
      </div>

      {/* Карточки подключений */}
      <div style={styles.cards}>
        {/* Банк */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>🏦</span>
            <span>Подключить банк</span>
          </div>
          <p style={styles.cardDesc}>Авто-импорт выписок для точного учёта</p>
          <div style={styles.bankButtons}>
            <button 
              onClick={() => handleConnectBank('Тинькофф')}
              disabled={connections.bank || loading}
              style={connections.bank ? styles.connectedBtn : styles.connectBtn}
            >
              {connections.bank ? '✓ Тинькофф' : 'Тинькофф'}
            </button>
            <button 
              onClick={() => handleConnectBank('Сбер')}
              disabled={connections.bank || loading}
              style={connections.bank ? styles.connectedBtn : styles.connectBtn}
            >
              {connections.bank ? '✓ Сбер' : 'Сбер'}
            </button>
          </div>
        </div>

        {/* Wildberries */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>📦</span>
            <span>Wildberries</span>
          </div>
          <p style={styles.cardDesc}>API-ключ из личного кабинета селлера</p>
          {!connections.wb ? (
            <input
              type="password"
              placeholder="Введите API-ключ"
              value={apiKeys.wb}
              onChange={e => setApiKeys(prev => ({...prev, wb: e.target.value}))}
              style={styles.apiInput}
            />
          ) : (
            <p style={styles.connectedText}>✓ Подключено</p>
          )}
          {!connections.wb && (
            <button 
              onClick={() => handleConnectMarketplace('wb')}
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? 'Проверка...' : 'Подключить'}
            </button>
          )}
        </div>

        {/* Ozon */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>🛒</span>
            <span>Ozon</span>
          </div>
          <p style={styles.cardDesc}>API-ключ из раздела "Настройки → API"</p>
          {!connections.ozon ? (
            <input
              type="password"
              placeholder="Введите API-ключ"
              value={apiKeys.ozon}
              onChange={e => setApiKeys(prev => ({...prev, ozon: e.target.value}))}
              style={styles.apiInput}
            />
          ) : (
            <p style={styles.connectedText}>✓ Подключено</p>
          )}
          {!connections.ozon && (
            <button 
              onClick={() => handleConnectMarketplace('ozon')}
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? 'Проверка...' : 'Подключить'}
            </button>
          )}
        </div>
      </div>

      {/* Кнопки навигации */}
      <div style={styles.footer}>
        <button onClick={() => navigate('/dashboard')} style={styles.skipButton}>
          Пропустить
        </button>
        <button 
          onClick={handleFinish}
          disabled={!isReady && !window.confirm}
          style={isReady ? styles.finishButton : styles.finishButtonDisabled}
        >
          Всё настроено! →
        </button>
      </div>
    </div>
  );
}

// Вспомогательный компонент статуса
function ConnectionStatus({ label, done }) {
  return (
    <div style={styles.statusItem}>
      <span style={{
        ...styles.statusDot,
        backgroundColor: done ? '#10B981' : '#9CA3AF'
      }} />
      <span style={{
        color: done ? '#374151' : '#6B7280',
        textDecoration: done ? 'none' : 'line-through'
      }}>
        {label}
      </span>
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
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px'
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px'
  },
  statusBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px'
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  card: {
    padding: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    backgroundColor: 'white'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  cardIcon: { fontSize: '20px' },
  cardDesc: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 12px 0'
  },
  bankButtons: {
    display: 'flex',
    gap: '12px'
  },
  connectBtn: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  connectedBtn: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'default'
  },
  apiInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    marginBottom: '12px',
    boxSizing: 'border-box'
  },
  connectedText: {
    color: '#10B981',
    fontWeight: '500',
    marginBottom: '12px'
  },
  button: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonDisabled: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#A5B4FC',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed'
  },
  footer: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB'
  },
  skipButton: {
    flex: 1,
    padding: '14px',
    fontSize: '15px',
    backgroundColor: 'white',
    color: '#6B7280',
    border: '1px solid #D1D5DB',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  finishButton: {
    flex: 2,
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  finishButtonDisabled: {
    flex: 2,
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    backgroundColor: '#A5B4FC',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'not-allowed'
  }
};