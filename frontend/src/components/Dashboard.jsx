// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddTransaction from './AddTransaction';

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'Аня';
  
  const [metrics, setMetrics] = useState({
    today_income: 24500,
    wb_sales: 30000,
    commission: 5500,
    tax: 1470,
    balance: 185320,
    lastSync: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})
  });
  const [transactions, setTransactions] = useState([
    { id: '1', date: '2026-03-05', description: 'WB синхронизация', amount: 30000, status: 'confirmed' },
    { id: '2', date: '2026-03-05', description: 'Счёт №154', amount: 2500, status: 'confirmed' },
  ]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  const loadData = async () => {
    if (!userId) { navigate('/'); return; }
    setLoading(true);
    
    try {
      const [mRes, tRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/dashboard/${userId}`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/transactions/${userId}`)
      ]);
      
      if (mRes.ok) setMetrics(await mRes.json());
      if (tRes.ok) setTransactions(await tRes.json());
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [userId, navigate]);

  const formatMoney = (n) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n || 0);

  const handleReserveTax = () => {
    alert(`Зарезервировать ${formatMoney(metrics.tax)} на налог?`);
  };

  if (loading && !metrics.today_income) return <div className="container text-center" style={{paddingTop: 40}}>Загрузка...</div>;

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
        {/* МЕТРИКИ ЗА СЕГОДНЯ */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>[ МЕТРИКИ ЗА СЕГОДНЯ ]</h2>
          <div style={styles.metricsGrid}>
            {/* СЕГОДНЯ */}
            <div style={styles.metricCard}>
              <h3 style={styles.metricTitle}>СЕГОДНЯ</h3>
              <p style={styles.metricValue}>{formatMoney(metrics.today_income)}</p>
              <div style={styles.breakdown}>
                <div style={styles.breakdownRow}>
                  <span>WB:</span>
                  <span>{formatMoney(metrics.wb_sales)}</span>
                </div>
                <div style={{...styles.breakdownRow, color: '#EF4444'}}>
                  <span>Комиссия:</span>
                  <span>-{formatMoney(metrics.commission)} ↓</span>
                </div>
              </div>
            </div>

            {/* НАЛОГ */}
            <div style={styles.metricCard}>
              <h3 style={styles.metricTitle}>НАЛОГ</h3>
              <p style={styles.metricValue}>{formatMoney(metrics.tax)}</p>
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
            {transactions.slice(0, 3).map(tx => (
              <div key={tx.id} style={styles.activityItem}>
                <div style={styles.activityLeft}>
                  <span style={styles.activityIcon}>📄</span>
                  <span>{tx.description}</span>
                </div>
                <div style={styles.activityRight}>
                  <span style={styles.activityAmount}>{formatMoney(tx.amount)}</span>
                  <span style={styles.checkmark}>✓</span>
                </div>
              </div>
            ))}
            <button style={styles.showAllButton}>
              ПОКАЗАТЬ ВСЁ ∨
            </button>
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
            <AddTransaction userId={userId} onSuccess={() => { setShowAdd(false); loadData(); }} onClose={() => setShowAdd(false)} />
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
    paddingBottom: '100px'
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
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px dashed #E5E7EB'
  },
  activityLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#374151'
  },
  activityIcon: {
    fontSize: '16px'
  },
  activityRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  activityAmount: {
    fontWeight: '600',
    color: '#1F2937'
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
  }
};