// src/components/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AddTransaction from './AddTransaction';

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Пользователь';
  const usnMode = localStorage.getItem('usnMode') || 'доходы';
  
  // Инициализация состояния
  const [metrics, setMetrics] = useState({
    today_income: 0,
    today_expense: 0,
    commission: 0,
    net_today: 0,
    tax_estimate: 0,
    wb_sales: 0,
    balance: 0,
    transaction_count: 0
  });
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Функция расчета метрик из транзакций
  const calculateMetricsFromTransactions = useCallback((txList) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTxs = txList.filter(tx => tx.date === today);
      
      const income = todayTxs
        .filter(tx => tx.category === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      
      const expense = todayTxs
        .filter(tx => tx.category === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      
      const commission = Math.round(income * 0.18);
      const netIncome = income - expense - commission;
      
      const usnRate = usnMode === 'доходы_расходы' ? 0.15 : 0.06;
      const taxBase = usnMode === 'доходы_расходы' ? netIncome : income;
      const tax = taxBase > 0 ? Math.round(taxBase * usnRate) : 0;
      
      const balance = netIncome - tax;
      
      setMetrics({
        today_income: income,
        today_expense: expense,
        commission: commission,
        net_today: netIncome,
        tax_estimate: tax,
        wb_sales: income,
        balance: balance,
        transaction_count: txList.length
      });
    } catch (err) {
      console.error('Calculate metrics error:', err);
    }
  }, [usnMode]);

  // Функция загрузки данных
  const loadData = useCallback(async () => {
    if (!userId) { 
      navigate('/'); 
      return; 
    }
    
    try {
      const tRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/transactions/${userId}`);
      if (tRes.ok) {
        const txData = await tRes.json();
        const transactionsList = txData || [];
        setTransactions(transactionsList);
        calculateMetricsFromTransactions(transactionsList);
      }
      setInitialized(true);
    } catch (err) {
      console.error('Load error:', err);
      setError('Не удалось загрузить данные');
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [userId, navigate, calculateMetricsFromTransactions]);

  // Загрузка при монтировании
  useEffect(() => { 
    loadData();
  }, [loadData]);

  // Обработка добавления транзакции
  const handleAddTransaction = useCallback((newTransaction) => {
    if (!newTransaction) return;
    
    setTransactions(prev => {
      const newTransactions = [newTransaction, ...prev];
      calculateMetricsFromTransactions(newTransactions);
      return newTransactions;
    });
    
    setShowAdd(false);
  }, [calculateMetricsFromTransactions]);

  const formatMoney = (n) => new Intl.NumberFormat('ru-RU', { 
    style: 'currency', 
    currency: 'RUB', 
    maximumFractionDigits: 0 
  }).format(n || 0);

  const handleReserveTax = () => {
    if (window.confirm(`Зарезервировать ${formatMoney(metrics.tax_estimate)} на налог?`)) {
      alert('Функция резервирования будет доступна после подключения банка');
    }
  };

  // Показываем лоадер только при первой загрузке
  if (loading && !initialized) {
    return (
      <div style={styles.page}>
        <div style={{...styles.container, textAlign: 'center', paddingTop: 40}}>
          <div style={styles.loader}>Загрузка данных...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>📦 ФинТап</div>
        <div style={styles.headerRight}>
          <button style={styles.helpButton}>Помощь</button>
          <button onClick={() => navigate('/profile')} style={styles.profileButton}>
            👤 {userName}
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Показываем ошибку если есть */}
        {error && (
          <div style={styles.errorBanner}>
            ⚠️ {error}
            <button onClick={() => setError(null)} style={styles.closeError}>×</button>
          </div>
        )}

        {/* МЕТРИКИ ЗА СЕГОДНЯ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>[ МЕТРИКИ ЗА СЕГОДНЯ ]</h2>
          <div style={styles.metricsGrid}>
            {/* СЕГОДНЯ */}
            <div style={styles.metricCard}>
              <h3 style={styles.metricTitle}>СЕГОДНЯ</h3>
              <p style={styles.metricValue}>{formatMoney(metrics.net_today)}</p>
              <div style={styles.breakdown}>
                <div style={styles.breakdownRow}>
                  <span>WB:</span>
                  <span>{formatMoney(metrics.wb_sales)}</span>
                </div>
                <div style={{...styles.breakdownRow, color: '#EF4444'}}>
                  <span>Комиссия:</span>
                  <span>-{formatMoney(metrics.commission)} ↓</span>
                </div>
                <div style={{...styles.breakdownRow, color: '#6B7280', fontSize: '11px'}}>
                  <span>Транзакций: {metrics.transaction_count}</span>
                </div>
              </div>
            </div>

            {/* НАЛОГ */}
            <div style={styles.metricCard}>
              <h3 style={styles.metricTitle}>НАЛОГ</h3>
              <p style={styles.metricValue}>{formatMoney(metrics.tax_estimate)}</p>
              <button onClick={handleReserveTax} style={styles.reserveButton}>
                ⊕ ОТЛОЖИТЬ
              </button>
            </div>

            {/* ОСТАТОК */}
            <div style={styles.metricCard}>
              <h3 style={styles.metricTitle}>ОСТАТОК</h3>
              <p style={styles.metricValue}>{formatMoney(metrics.balance)}</p>
              <p style={styles.metricSubtitle}>Чистый доход</p>
            </div>
          </div>
        </section>

        {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>[ БЫСТРЫЕ ДЕЙСТВИЯ ]</h2>
          <div style={styles.actionsGrid}>
            <button onClick={() => setShowAdd(true)} style={styles.actionButton}>
              <div style={styles.actionIcon}>📷</div>
              <span style={styles.actionLabel}>СКАНИРОВАТЬ ЧЕК</span>
            </button>
            <button onClick={() => {}} style={styles.actionButton}>
              <div style={styles.actionIcon}>⚠️</div>
              <span style={styles.actionLabel}>ПРОВЕРИТЬ ОШИБКИ</span>
            </button>
            <button onClick={() => {}} style={styles.actionButton}>
              <div style={styles.actionIcon}>📈</div>
              <span style={styles.actionLabel}>ПРОГНОЗ МЕСЯЦА</span>
            </button>
          </div>
        </section>

        {/* ПОСЛЕДНЯЯ АКТИВНОСТЬ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>[ ПОСЛЕДНЯЯ АКТИВНОСТЬ ]</h2>
          <div style={styles.activityCard}>
            {transactions.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Нет транзакций</p>
                <button onClick={() => setShowAdd(true)} style={styles.addFirstBtn}>
                  + Добавить первую
                </button>
              </div>
            ) : (
              <>
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} style={styles.activityItem}>
                    <div style={styles.activityLeft}>
                      <span style={styles.activityIcon}>📄</span>
                      <div>
                        <div style={styles.activityDescription}>
                          {tx.counterparty || 'Не указано'}
                        </div>
                        <div style={styles.activityDate}>
                          {new Date(tx.date).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    <div style={styles.activityRight}>
                      <span style={{
                        ...styles.activityAmount,
                        color: tx.category === 'income' ? '#10B981' : '#EF4444'
                      }}>
                        {tx.category === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                      <span style={styles.checkmark}>✓</span>
                    </div>
                  </div>
                ))}
                {transactions.length > 5 && (
                  <button style={styles.showAllButton}>
                    ПОКАЗАТЬ ВСЁ ∨
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav style={styles.bottomNav}>
        <button style={{...styles.navItem, ...styles.navActive}}>
          <div style={styles.navIcon}>🏠</div>
          <span>ГЛАВНАЯ</span>
        </button>
        <button onClick={() => {}} style={styles.navItem}>
          <div style={styles.navIcon}>📊</div>
          <span>УЧЕТ</span>
        </button>
        <button onClick={() => {}} style={styles.navItem}>
          <div style={styles.navIcon}>💰</div>
          <span>НАЛОГИ</span>
        </button>
        <button onClick={() => navigate('/profile')} style={styles.navItem}>
          <div style={styles.navIcon}>👤</div>
          <span>ПРОФИЛЬ</span>
        </button>
      </nav>

      {/* Modal for adding transaction */}
      {showAdd && (
        <div style={styles.modal} onClick={() => setShowAdd(false)}>
          <div className="card" style={{maxWidth: 400, width: '90%'}} onClick={e => e.stopPropagation()}>
            <AddTransaction 
              userId={userId} 
              onSuccess={handleAddTransaction}
              onClose={() => setShowAdd(false)} 
            />
          </div>
        </div>
      )}
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
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%'
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
    paddingBottom: '100px',
    maxWidth: '1200px',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  metricCard: {
    backgroundColor: 'white',
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    padding: '16px'
  },
  metricTitle: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '8px',
    fontWeight: '500'
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '8px'
  },
  metricSubtitle: {
    fontSize: '12px',
    color: '#9CA3AF'
  },
  breakdown: {
    fontSize: '12px'
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    color: '#6B7280'
  },
  reserveButton: {
    width: '100%',
    padding: '8px',
    fontSize: '13px',
    border: '1px dashed #D1D5DB',
    borderRadius: '6px',
    background: 'white',
    cursor: 'pointer',
    color: '#4B5563'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  actionButton: {
    backgroundColor: 'white',
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  actionIcon: {
    fontSize: '24px'
  },
  actionLabel: {
    fontSize: '11px',
    color: '#6B7280',
    textAlign: 'center'
  },
  activityCard: {
    backgroundColor: 'white',
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    padding: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  emptyText: {
    color: '#9CA3AF',
    marginBottom: '16px',
    fontSize: '14px'
  },
  addFirstBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    border: '1px solid #4F46E5',
    borderRadius: '6px',
    background: '#EEF2FF',
    color: '#4F46E5',
    cursor: 'pointer',
    fontWeight: '500'
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px dashed #E5E7EB'
  },
  activityLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    flex: 1
  },
  activityIcon: {
    fontSize: '16px',
    marginTop: '2px'
  },
  activityDescription: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500'
  },
  activityDate: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '2px'
  },
  activityRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  activityAmount: {
    fontWeight: '600',
    fontSize: '14px'
  },
  checkmark: {
    color: '#10B981',
    fontWeight: '700'
  },
  showAllButton: {
    width: '100%',
    padding: '12px',
    fontSize: '13px',
    border: 'none',
    background: 'none',
    color: '#6B7280',
    cursor: 'pointer',
    borderTop: '1px dashed #E5E7EB',
    marginTop: '8px'
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0',
    zIndex: 100
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#6B7280',
    fontSize: '11px'
  },
  navActive: {
    color: '#1F2937',
    backgroundColor: '#1F2937'
  },
  navIcon: {
    fontSize: '20px'
  },
  modal: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200
  },
  loader: {
    fontSize: '16px',
    color: '#6B7280'
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeError: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#DC2626'
  }
};