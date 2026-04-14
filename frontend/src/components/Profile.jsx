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
  const [activeTab, setActiveTab] = useState('connections'); // Для десктопа

  // Загрузка существующих подключений
  useEffect(() => {
    const loadConnections = async () => {
      if (!userId) return;
      try {
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          bank_name: bankName,
          account_number: '40802810...',
          type: 'checking',
          crm_synced: false
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
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={() => navigate('/')} style={styles.logoButton}>
            💰 <span style={styles.logoText}>ФинТап</span>
          </button>
          <nav style={styles.desktopNav}>
            <button 
              onClick={() => setActiveTab('connections')}
              style={activeTab === 'connections' ? styles.navActive : styles.navButton}
            >
              Подключения
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={activeTab === 'settings' ? styles.navActive : styles.navButton}
            >
              Настройки
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              style={styles.navButton}
            >
              Дашборд →
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.contentWrapper}>
          {/* Sidebar для десктопа */}
          <aside style={styles.sidebar}>
            <div style={styles.progressCard}>
              <h3 style={styles.sidebarTitle}>Прогресс настройки</h3>
              <div style={styles.progressSteps}>
                <StepItem label="Телефон" done />
                <StepItem label="ИНН" done />
                <StepItem label="Банк" done={connections.bank} />
                <StepItem label="Маркетплейс" done={connections.wb || connections.ozon} />
              </div>
            </div>
            
            <div style={styles.helpCard}>
              <h4>💡 Подсказка</h4>
              <p style={styles.helpText}>
                Подключите хотя бы один источник данных для начала работы с дашбордом.
              </p>
            </div>
          </aside>

          {/* Основной контент */}
          <div style={styles.mainContent}>
            <div style={styles.pageHeader}>
              <h1 style={styles.pageTitle}>Профиль и подключения</h1>
              <p style={styles.pageSubtitle}>
                Настройте интеграции для автоматической синхронизации данных
              </p>
            </div>

            {/* Карточки подключений */}
            <div style={styles.cardsGrid}>
              {/* Банк */}
              <ConnectionCard
                icon="🏦"
                title="Подключить банк"
                description="Авто-импорт выписок для точного учёта доходов и расходов"
                connected={connections.bank}
                onConnect={() => handleConnectBank('Тинькофф')}
                loading={loading}
                alternative={() => (
                  <div style={styles.bankAlternatives}>
                    <button 
                      onClick={() => handleConnectBank('Тинькофф')}
                      disabled={connections.bank || loading}
                      style={connections.bank ? styles.connectedBtn : styles.altButton}
                    >
                      {connections.bank ? '✓ Тинькофф' : 'Тинькофф'}
                    </button>
                    <button 
                      onClick={() => handleConnectBank('Сбер')}
                      disabled={connections.bank || loading}
                      style={connections.bank ? styles.connectedBtn : styles.altButton}
                    >
                      {connections.bank ? '✓ Сбер' : 'Сбер'}
                    </button>
                  </div>
                )}
              />

              {/* Wildberries */}
              <ConnectionCard
                icon="📦"
                title="Wildberries"
                description="API-ключ из личного кабинета селлера (Настройки → Профиль → Доступы)"
                connected={connections.wb}
                apiKey={apiKeys.wb}
                onApiKeyChange={(val) => setApiKeys(prev => ({...prev, wb: val}))}
                onConnect={() => handleConnectMarketplace('wb')}
                loading={loading}
                helpUrl="https://seller.wildberries.ru/help"
              />

              {/* Ozon */}
              <ConnectionCard
                icon="🛒"
                title="Ozon"
                description="API-ключ из раздела «Настройки → API» в личном кабинете"
                connected={connections.ozon}
                apiKey={apiKeys.ozon}
                onApiKeyChange={(val) => setApiKeys(prev => ({...prev, ozon: val}))}
                onConnect={() => handleConnectMarketplace('ozon')}
                loading={loading}
                helpUrl="https://help.ozon.ru"
              />
            </div>

            {/* Дополнительные настройки */}
            <div style={styles.settingsSection}>
              <h3 style={styles.sectionTitle}>Дополнительно</h3>
              <div style={styles.settingsGrid}>
                <SettingItem
                  label="Режим налогообложения"
                  value="УСН «Доходы» (6%)"
                  editable
                  onClick={() => {}}
                />
                <SettingItem
                  label="Уведомления"
                  value="Push + Email"
                  editable
                  onClick={() => {}}
                />
                <SettingItem
                  label="Валюта отчётов"
                  value="RUB"
                  editable
                  onClick={() => {}}
                />
              </div>
            </div>

            {/* Footer кнопки */}
            <div style={styles.footer}>
              <button onClick={() => navigate('/dashboard')} style={styles.skipButton}>
                Пропустить и перейти к дашборду
              </button>
              <button 
                onClick={handleFinish}
                disabled={!isReady}
                style={isReady ? styles.finishButton : styles.finishButtonDisabled}
              >
                Всё настроено! Перейти к дашборду →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Вспомогательные компоненты
function StepItem({ label, done }) {
  return (
    <div style={styles.stepItem}>
      <div style={{
        ...styles.stepDot,
        backgroundColor: done ? '#10B981' : '#E5E7EB',
        borderColor: done ? '#10B981' : '#D1D5DB'
      }}>
        {done && '✓'}
      </div>
      <span style={{
        color: done ? '#374151' : '#9CA3AF',
        textDecoration: done ? 'none' : 'line-through'
      }}>
        {label}
      </span>
    </div>
  );
}

function ConnectionCard({ icon, title, description, connected, apiKey, onApiKeyChange, onConnect, loading, alternative, helpUrl }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={styles.cardIcon}>{icon}</span>
        <div>
          <h3 style={styles.cardTitle}>{title}</h3>
          {connected && <span style={styles.connectedBadge}>✓ Подключено</span>}
        </div>
      </div>
      <p style={styles.cardDesc}>{description}</p>
      
      {helpUrl && (
        <a href={helpUrl} target="_blank" rel="noopener noreferrer" style={styles.helpLink}>
          📖 Инструкция по получению ключа
        </a>
      )}
      
      {!connected ? (
        <>
          {apiKey !== undefined && (
            <input
              type="password"
              placeholder="Введите API-ключ"
              value={apiKey}
              onChange={e => onApiKeyChange?.(e.target.value)}
              style={styles.apiInput}
            />
          )}
          {alternative?.()}
          {!apiKey && !alternative && (
            <button 
              onClick={onConnect}
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? 'Подключение...' : 'Подключить'}
            </button>
          )}
        </>
      ) : (
        <div style={styles.connectedActions}>
          <button style={styles.manageButton}>Управление</button>
          <button style={styles.disconnectButton}>Отключить</button>
        </div>
      )}
    </div>
  );
}

function SettingItem({ label, value, editable, onClick }) {
  return (
    <div style={styles.settingItem}>
      <div>
        <span style={styles.settingLabel}>{label}</span>
        <p style={styles.settingValue}>{value}</p>
      </div>
      {editable && (
        <button onClick={onClick} style={styles.editButton}>Изменить</button>
      )}
    </div>
  );
}

// Стили
const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#F9FAFB'
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #E5E7EB',
    padding: '16px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1F2937',
    cursor: 'pointer'
  },
  logoText: { fontSize: '18px' },
  desktopNav: {
    display: 'none',
    gap: '8px',
    '@media (min-width: 768px)': { display: 'flex' }
  },
  navButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#6B7280',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  navActive: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  main: {
    flex: 1,
    padding: '24px'
  },
  contentWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
    '@media (min-width: 1024px)': {
      gridTemplateColumns: '280px 1fr'
    }
  },
  sidebar: {
    display: 'none',
    flexDirection: 'column',
    gap: '16px',
    '@media (min-width: 1024px)': { display: 'flex' }
  },
  progressCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 16px 0'
  },
  progressSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px'
  },
  stepDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'white',
    border: '2px solid'
  },
  helpCard: {
    backgroundColor: '#FFFBEB',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #FCD34D'
  },
  helpText: {
    fontSize: '14px',
    color: '#92400E',
    margin: '8px 0 0 0',
    lineHeight: 1.4
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  pageHeader: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 8px 0'
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#6B7280',
    margin: 0
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    },
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    }
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cardIcon: { fontSize: '24px' },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0
  },
  connectedBadge: {
    fontSize: '12px',
    color: '#10B981',
    fontWeight: '500'
  },
  cardDesc: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.4
  },
  helpLink: {
    fontSize: '13px',
    color: '#4F46E5',
    textDecoration: 'none'
  },
  apiInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    boxSizing: 'border-box'
  },
  bankAlternatives: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  altButton: {
    flex: '1 1 auto',
    minWidth: '100px',
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '500',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonDisabled: {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    fontWeight: '500',
    backgroundColor: '#A5B4FC',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed'
  },
  connectedBtn: {
    flex: '1 1 auto',
    minWidth: '100px',
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'default'
  },
  connectedActions: {
    display: 'flex',
    gap: '8px'
  },
  manageButton: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    border: '1px solid #C7D2FE',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  disconnectButton: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FCA5A5',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  settingsSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 16px 0'
  },
  settingsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F3F4F6'
  },
  settingLabel: {
    fontSize: '14px',
    color: '#6B7280'
  },
  settingValue: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1F2937',
    margin: '4px 0 0 0'
  },
  editButton: {
    padding: '6px 12px',
    fontSize: '13px',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    border: '1px solid #C7D2FE',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  footer: {
    display: 'flex',
    gap: '12px',
    padding: '16px 0'
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