// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  
  const [metrics, setMetrics] = useState({
    todayIncome: 0,
    taxAmount: 0,
    balance: 0,
    lastSync: null
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiFlags, setAiFlags] = useState([]);

  // Загрузка данных дашборда
  useEffect(() => {
    const loadDashboard = async () => {
      if (!userId) {
        navigate('/');
        return;
      }
      
      setLoading(true);
      try {
        // TODO: Заменить на реальные API вызовы
        // 1. Загружаем транзакции
        const txResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/transactions/${userId}?limit=10`
        );
        const txData = await txResponse.json();
        setTransactions(txData);

        // 2. Считаем метрики
        const today = new Date().toISOString().split('T')[0];
        const todayTx = txData.filter(t => t.date === today && t.category === 'income');
        const todayIncome = todayTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        // Получаем режим УСН из профиля (упрощённо)
        const usnRate = 0.06; // TODO: загрузить из профиля
        const taxAmount = todayIncome * usnRate;
        
        setMetrics({
          todayIncome,
          taxAmount,
          balance: 185000, // TODO: загрузить из accounts
          lastSync: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})
        });

        // 3. Загружаем AI-флаги (ПР-03: AIFlag сущность)
        const flagsResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/flags/${userId}?status=active`
        );
        if (flagsResponse.ok) {
          const flags = await flagsResponse.json();
          setAiFlags(flags);
        }
      } catch (err) {
        console.error('Ошибка загрузки дашборда:', err);
        // Fallback данные для демо
        setMetrics({
          todayIncome: 24500,
          taxAmount: 1470,
          balance: 185000,
          lastSync: '—'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
    
    // Авто-обновление каждые 5 минут (US14: оффлайн-кэш)
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, navigate]);

  // Форматирование суммы
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Pull-to-refresh (упрощённо)
  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Перезагружаем данные
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>ФинТап</h1>
          <p style={styles.subtitle}>
            {loading ? 'Загрузка...' : `Синхронизация: ${metrics.lastSync || '—'}`}
          </p>
        </div>
        <button onClick={() => navigate('/profile')} style={styles.settingsButton}>⚙️</button>
      </div>

      {/* Метрики (Hero) */}
      <div style={styles.metricsGrid}>
        <MetricCard 
          title="Сегодня" 
          value={formatMoney(metrics.todayIncome)}
          icon="💰"
          color="#10B981"
        />
        <MetricCard 
          title="Налог" 
          value={formatMoney(metrics.taxAmount)}
          icon="📋"
          color="#F59E0B"
          highlight
        />
        <MetricCard 
          title="Остаток" 
          value={formatMoney(metrics.balance)}
          icon="🏦"
          color="#3B82F6"
        />
      </div>

      {/* AI-флаги (если есть) */}
      {aiFlags.length > 0 && (
        <div style={styles.flagsSection}>
          <div style={styles.flagsHeader}>
            <span>⚠️ Требует внимания</span>
            <button onClick={() => navigate('/flags')} style={styles.viewAllButton}>
              Проверить →
            </button>
          </div>
          {aiFlags.slice(0, 2).map(flag => (
            <div key={flag.id} style={styles.flagCard}>
              <span style={{
                ...styles.flagIcon,
                backgroundColor: flag.severity === 'critical' ? '#FECACA' : '#FEF3C7'
              }}>
                {flag.severity === 'critical' ? '🔴' : '🟡'}
              </span>
              <p style={styles.flagText}>{flag.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={styles.actionsSection}>
        <h3 style={styles.sectionTitle}>Быстрые действия</h3>
        <div style={styles.actionsGrid}>
          <ActionButton 
            icon="📷" 
            label="Сканировать чек"
            onClick={() => navigate('/scanner')}
          />
          <ActionButton 
            icon="🔍" 
            label="Проверить ошибки"
            onClick={() => navigate('/flags')}
            badge={aiFlags.length > 0 ? aiFlags.length : null}
          />
          <ActionButton 
            icon="🧾" 
            label="Налоги"
            onClick={() => navigate('/taxes')}
          />
        </div>
      </div>

      {/* Последние транзакции */}
      <div style={styles.transactionsSection}>
        <div style={styles.transactionsHeader}>
          <h3 style={styles.sectionTitle}>Последние операции</h3>
          <button style={styles.viewAllButton}>Все →</button>
        </div>
        
        {loading ? (
          <div style={styles.loading}>Загрузка...</div>
        ) : transactions.length === 0 ? (
          <p style={styles.emptyText}>Нет операций за сегодня</p>
        ) : (
          <div style={styles.transactionsList}>
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} style={styles.transactionItem}>
                <div>
                  <p style={styles.txCounterparty}>{tx.counterparty || 'Неизвестно'}</p>
                  <p style={styles.txDate}>{new Date(tx.date).toLocaleDateString('ru-RU')}</p>
                </div>
                <span style={{
                  ...styles.txAmount,
                  color: tx.category === 'income' ? '#10B981' : '#EF4444'
                }}>
                  {tx.category === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pull-to-refresh индикатор */}
      <div 
        style={styles.refreshHint}
        onTouchStart={() => {}}
        onClick={handleRefresh}
      >
        ↓ Потяните вниз для обновления
      </div>
    </div>
  );
}

// Вспомогательные компоненты
function MetricCard({ title, value, icon, color, highlight }) {
  return (
    <div style={{
      ...styles.metricCard,
      borderLeft: `4px solid ${color}`,
      ...(highlight && { backgroundColor: '#FFFBEB' })
    }}>
      <div style={styles.metricHeader}>
        <span style={styles.metricIcon}>{icon}</span>
        <span style={styles.metricTitle}>{title}</span>
      </div>
      <p style={styles.metricValue}>{value}</p>
    </div>
  );
}

function ActionButton({ icon, label, onClick, badge }) {
  return (
    <button onClick={onClick} style={styles.actionButton}>
      <span style={styles.actionIcon}>{icon}</span>
      <span style={styles.actionLabel}>{label}</span>
      {badge && <span style={styles.badge}>{badge}</span>}
    </button>
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
    backgroundColor: '#F9FAFB'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
    color: '#1F2937'
  },
  subtitle: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '4px 0 0 0'
  },
  settingsButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px'
  },
  metricCard: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  metricIcon: { fontSize: '18px' },
  metricTitle: {
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0
  },
  flagsSection: {
    marginBottom: '20px'
  },
  flagsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  flagCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  flagIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px'
  },
  flagText: {
    fontSize: '14px',
    color: '#374151',
    margin: 0,
    flex: 1
  },
  viewAllButton: {
    fontSize: '13px',
    color: '#4F46E5',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  actionsSection: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 12px 0'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  actionButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 12px',
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    cursor: 'pointer',
    position: 'relative'
  },
  actionIcon: { fontSize: '24px' },
  actionLabel: {
    fontSize: '12px',
    color: '#374151',
    textAlign: 'center'
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#EF4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center'
  },
  transactionsSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  transactionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  loading: {
    textAlign: 'center',
    color: '#6B7280',
    padding: '20px'
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '14px',
    padding: '20px 0'
  },
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F3F4F6'
  },
  txCounterparty: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1F2937',
    margin: 0
  },
  txDate: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '2px 0 0 0'
  },
  txAmount: {
    fontSize: '15px',
    fontWeight: '600'
  },
  refreshHint: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#9CA3AF',
    padding: '16px 0',
    cursor: 'pointer'
  }
};