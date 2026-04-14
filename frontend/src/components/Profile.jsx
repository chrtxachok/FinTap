// src/components/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Аня';
  
  const [connections, setConnections] = useState({
    phone: true,
    usn: true,
    bank: false,
    marketplace: false
  });
  const [loading, setLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState({ wb: '', ozon: '' });

  const handleConnectBank = async (bankName) => {
    setLoading(true);
    setTimeout(() => {
      setConnections(prev => ({ ...prev, bank: true }));
      setLoading(false);
    }, 1500);
  };

  const handleConnectMarketplace = async (mp) => {
    const key = apiKeys[mp];
    if (!key || key.length < 10) {
      alert('Введите корректный API-ключ');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setConnections(prev => ({ ...prev, marketplace: true }));
      setApiKeys(prev => ({ ...prev, [mp]: '' }));
      setLoading(false);
    }, 2000);
  };

  const isReady = connections.bank || connections.marketplace;

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>📦 ФинТап</div>
        <div style={styles.headerRight}>
          <button style={styles.helpButton}>Помощь</button>
          <button style={styles.profileButton}>
            👤 {userName}
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* СТАТУС НАСТРОЙКИ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>СТАТУС НАСТРОЙКИ</h2>
          <div style={styles.statusCard}>
            <label style={styles.statusItem}>
              <input type="checkbox" checked readOnly style={styles.checkbox} />
              <span>Телефон подтвержден</span>
            </label>
            <label style={styles.statusItem}>
              <input type="checkbox" checked readOnly style={styles.checkbox} />
              <span>УСН выбран</span>
            </label>
            <label style={styles.statusItem}>
              <input type="checkbox" checked={connections.bank} readOnly style={styles.checkbox} />
              <span>Банк подключен</span>
              <span style={styles.arrow}>⊕</span>
            </label>
            <label style={styles.statusItem}>
              <input type="checkbox" checked={connections.marketplace} readOnly style={styles.checkbox} />
              <span>WB/Ozon</span>
              <span style={styles.arrow}>⊕</span>
            </label>
          </div>
        </section>

        {/* ПОДКЛЮЧЕНИЯ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>ПОДКЛЮЧЕНИЯ</h2>
          
          {/* Тинькофф */}
          <div style={styles.connectionCard}>
            <div style={styles.connectionHeader}>
              <div style={styles.connectionIcon}>Т</div>
              <div>
                <h3 style={styles.connectionTitle}>Тинькофф Бизнес</h3>
                <p style={styles.connectionDesc}>Банк для бизнеса</p>
              </div>
            </div>
            <button 
              onClick={() => handleConnectBank('Тинькофф')}
              disabled={connections.bank || loading}
              style={connections.bank ? styles.connectedBtn : styles.connectBtn}
            >
              {connections.bank ? '✓ Подключено' : 'Подключить'}
            </button>
          </div>

          {/* Сбер */}
          <div style={styles.connectionCard}>
            <div style={styles.connectionHeader}>
              <div style={styles.connectionIcon}>С</div>
              <div>
                <h3 style={styles.connectionTitle}>Сбер</h3>
                <p style={styles.connectionDesc}>СберБизнес</p>
              </div>
            </div>
            <button 
              onClick={() => handleConnectBank('Сбер')}
              disabled={connections.bank || loading}
              style={connections.bank ? styles.connectedBtn : styles.connectBtn}
            >
              {connections.bank ? '✓ Подключено' : 'Подключить'}
            </button>
          </div>

          {/* Wildberries */}
          <div style={styles.connectionCard}>
            <div style={styles.connectionHeader}>
              <div style={styles.connectionIcon}>WB</div>
              <div>
                <h3 style={styles.connectionTitle}>Wildberries</h3>
                <p style={styles.connectionDesc}>Маркетплейс</p>
              </div>
            </div>
            {!connections.marketplace ? (
              <>
                <input
                  type="text"
                  placeholder="API-ключ"
                  value={apiKeys.wb}
                  onChange={e => setApiKeys(prev => ({...prev, wb: e.target.value}))}
                  style={styles.apiInput}
                />
                <button 
                  onClick={() => handleConnectMarketplace('wb')}
                  disabled={loading}
                  style={styles.verifyBtn}
                >
                  Проверить
                </button>
              </>
            ) : (
              <span style={styles.connectedText}>✓ Подключено</span>
            )}
          </div>

          {/* Ozon */}
          <div style={styles.connectionCard}>
            <div style={styles.connectionHeader}>
              <div style={styles.connectionIcon}>OZ</div>
              <div>
                <h3 style={styles.connectionTitle}>Ozon</h3>
                <p style={styles.connectionDesc}>Маркетплейс</p>
              </div>
            </div>
            {!connections.marketplace ? (
              <>
                <input
                  type="text"
                  placeholder="API-ключ"
                  value={apiKeys.ozon}
                  onChange={e => setApiKeys(prev => ({...prev, ozon: e.target.value}))}
                  style={styles.apiInput}
                />
                <button 
                  onClick={() => handleConnectMarketplace('ozon')}
                  disabled={loading}
                  style={styles.verifyBtn}
                >
                  Проверить
                </button>
              </>
            ) : (
              <span style={styles.connectedText}>✓ Подключено</span>
            )}
          </div>
        </section>

        {/* Кнопки */}
        <div style={styles.footer}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={styles.completeBtn}
          >
            Завершите настройку
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            style={styles.skipBtn}
          >
            Пропустить
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #E5E7EB'
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1F2937'
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  helpButton: {
    padding: '6px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer'
  },
  profileButton: {
    padding: '6px 12px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  main: {
    flex: 1,
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: '12px',
    letterSpacing: '0.5px'
  },
  statusCard: {
    backgroundColor: 'white',
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    padding: '16px'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px dashed #E5E7EB'
  },
  checkbox: {
    width: '16px',
    height: '16px'
  },
  arrow: {
    marginLeft: 'auto',
    color: '#9CA3AF'
  },
  connectionCard: {
    backgroundColor: 'white',
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px'
  },
  connectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  connectionIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#F3F4F6',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
    color: '#6B7280'
  },
  connectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0
  },
  connectionDesc: {
    fontSize: '12px',
    color: '#9CA3AF',
    margin: '2px 0 0 0'
  },
  connectBtn: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    color: '#4B5563'
  },
  connectedBtn: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #10B981',
    borderRadius: '6px',
    background: '#D1FAE5',
    cursor: 'default',
    color: '#065F46'
  },
  apiInput: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    marginBottom: '8px',
    boxSizing: 'border-box'
  },
  verifyBtn: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer'
  },
  connectedText: {
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    display: 'block',
    padding: '10px 0'
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '24px'
  },
  completeBtn: {
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    color: '#4B5563'
  },
  skipBtn: {
    padding: '14px',
    fontSize: '15px',
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    color: '#6B7280'
  }
};