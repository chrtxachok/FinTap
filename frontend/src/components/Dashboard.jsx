// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  
  const [metrics, setMetrics] = useState({
    todayIncome: 24500,
    taxAmount: 1470,
    balance: 185000,
    lastSync: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})
  });
  const [transactions, setTransactions] = useState([
    { id: '1', date: '2026-04-13', amount: 15000, category: 'income', counterparty: 'Wildberries' },
    { id: '2', date: '2026-04-13', amount: 3500, category: 'expense', counterparty: 'СДЭК' },
    { id: '3', date: '2026-04-12', amount: 9500, category: 'income', counterparty: 'Ozon' },
  ]);
  const [aiFlags, setAiFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('day'); // day/week/month для десктопа

  // Загрузка данных
  useEffect(() => {
    const loadDashboard = async () => {
      if (!userId) {
        navigate('/');
        return;
      }
      
      setLoading(true);
      try {
        // TODO: Реальные API вызовы
        const txResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/transactions/${userId}?limit=10`
        );
        if (txResponse.ok) {
          const txData = await txResponse.json();
          setTransactions(txData);
        }
      } catch (err) {
        console.error('Ошибка загрузки:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, navigate]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={() => navigate('/')} style={styles.logoButton}>
            💰 <span style={styles.logoText}>ФинТап</span>
          </button>
          
          {/* Desktop Navigation */}
          <nav style={styles.desktopNav}>
            <button style={styles.navButton}>Дашборд</button>
            <button style={styles.navButton} onClick={() => navigate('/profile')}>Профиль</button>
            <button style={styles.navButton}>Отчёты</button>
            <button style={styles.navButton}>Помощь</button>
          </nav>

          {/* Sync Status */}
          <div style={styles.syncStatus}>
            <span style={styles.syncDot}>●</span>
            <span style={styles.syncText}>
              {loading ? 'Синхронизация...' : `Обновлено: ${metrics.lastSync}`}
            </span>
            <button onClick={handleRefresh} style={styles.refreshButton}>↻</button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.contentWrapper}>
          {/* Sidebar для десктопа */}
          <aside style={styles.sidebar}>
            <div style={styles.sidebarSection}>
              <h4 style={styles.sidebarTitle}>Период</h4>
              <div style={styles.periodTabs}>
                {['day', 'week', 'month'].map(period => (
                  <button
                    key={period}
                    onClick={() => setViewMode(period)}
                    style={viewMode === period ? styles.tabActive : styles.tabButton}
                  >
                    {period === 'day' ? 'Сегодня' : period === 'week' ? 'Неделя' : 'Месяц'}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.sidebarSection}>
              <h4 style={styles.sidebarTitle}>Быстрые действия</h4>
              <div style={styles.quickActionsList}>
                <QuickAction icon="📷" label="Сканировать чек" onClick={() => {}} />
                <QuickAction icon="📤" label="Экспорт отчёта" onClick={() => {}} />
                <QuickAction icon="🧾" label="Налоги" onClick={() => {}} />
                <QuickAction icon="⚙️" label="Настройки" onClick={() => navigate('/profile')} />
              </div>
            </div>

            {aiFlags.length > 0 && (
              <div style={styles.alertsCard}>
                <h4 style={styles.sidebarTitle}>⚠️ Требует внимания</h4>
                {aiFlags.slice(0, 2).map(flag => (
                  <div key={flag.id} style={styles.alertItem}>
                    <span style={styles.alertIcon}>{flag.severity === 'critical' ? '🔴' : '🟡'}</span>
                    <p style={styles.alertText}>{flag.message}</p>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Основной контент */}
          <div style={styles.mainContent}>
            {/* Hero Metrics */}
            <section style={styles.metricsSection}>
              <div style={styles.metricsGrid}>
                <MetricCard 
                  title="Доход сегодня" 
                  value={formatMoney(metrics.todayIncome)}
                  icon="💰"
                  color="#10B981"
                  trend="+12%"
                />
                <MetricCard 
                  title="Налог к уплате" 
                  value={formatMoney(metrics.taxAmount)}
                  icon="📋"
                  color="#F59E0B"
                  highlight
                  deadline="до 25.04"
                />
                <MetricCard 
                  title="Остаток на счетах" 
                  value={formatMoney(metrics.balance)}
                  icon="🏦"
                  color="#3B82F6"
                />
                <MetricCard 
                  title="Чистая прибыль" 
                  value={formatMoney(metrics.todayIncome - metrics.taxAmount)}
                  icon="📈"
                  color="#8B5CF6"
                  trend="+8%"
                />
              </div>
            </section>

            {/* Charts Section (только для десктопа) */}
            <section style={styles.chartsSection}>
              <div style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <h3 style={styles.chartTitle}>Динамика доходов</h3>
                  <select style={styles.chartSelect}>
                    <option>7 дней</option>
                    <option>30 дней</option>
                    <option>90 дней</option>
                  </select>
                </div>
                <div style={styles.chartPlaceholder}>
                  <div style={styles.chartBars}>
                    {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                      <div key={i} style={{...styles.chartBar, height: `${h}%`}} />
                    ))}
                  </div>
                  <div style={styles.chartLabels}>
                    {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                      <span key={d} style={styles.chartLabel}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.chartCard}>
                <div style={styles.chartHeader}>
                  <h3 style={styles.chartTitle}>Расходы по категориям</h3>
                </div>
                <div style={styles.piePlaceholder}>
                  <div style={styles.pieChart}>
                    <div style={{...styles.pieSlice, backgroundColor: '#3B82F6', transform: 'rotate(0deg)'}} />
                    <div style={{...styles.pieSlice, backgroundColor: '#10B981', transform: 'rotate(120deg)'}} />
                    <div style={{...styles.pieSlice, backgroundColor: '#F59E0B', transform: 'rotate(240deg)'}} />
                  </div>
                  <div style={styles.pieLegend}>
                    <LegendItem color="#3B82F6" label="Логистика" value="45%" />
                    <LegendItem color="#10B981" label="Реклама" value="30%" />
                    <LegendItem color="#F59E0B" label="Прочее" value="25%" />
                  </div>
                </div>
              </div>
            </section>

            {/* Transactions Table */}
            <section style={styles.transactionsSection}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Последние операции</h3>
                <button style={styles.viewAllButton}>Все транзакции →</button>
              </div>
              
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Дата</th>
                      <th style={styles.th}>Контрагент</th>
                      <th style={styles.th}>Категория</th>
                      <th style={styles.th}>Сумма</th>
                      <th style={styles.th}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} style={styles.tr}>
                        <td style={styles.td}>{new Date(tx.date).toLocaleDateString('ru-RU')}</td>
                        <td style={styles.td}>{tx.counterparty}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.categoryBadge,
                            backgroundColor: tx.category === 'income' ? '#D1FAE5' : '#FEF3C7',
                            color: tx.category === 'income' ? '#065F46' : '#92400E'
                          }}>
                            {tx.category === 'income' ? 'Доход' : 'Расход'}
                          </span>
                        </td>
                        <td style={{
                          ...styles.td,
                          fontWeight: '600',
                          color: tx.category === 'income' ? '#10B981' : '#EF4444'
                        }}>
                          {tx.category === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge}>✓ Подтверждено</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Tax Reminder Card */}
            <section style={styles.taxCard}>
              <div style={styles.taxCardContent}>
                <div style={styles.taxIcon}>📋</div>
                <div style={styles.taxContent}>
                  <h4 style={styles.taxTitle}>Не забудьте оплатить налог</h4>
                  <p style={styles.taxText}>
                    Сумма к уплате: <strong>{formatMoney(metrics.taxAmount)}</strong><br/>
                    Крайний срок: <strong>25 апреля 2026</strong>
                  </p>
                </div>
                <button style={styles.payButton}>Оплатить сейчас</button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

// Вспомогательные компоненты
function MetricCard({ title, value, icon, color, trend, highlight, deadline }) {
  return (
    <div style={{
      ...styles.metricCard,
      borderLeft: `4px solid ${color}`,
      ...(highlight && { backgroundColor: '#FFFBEB' })
    }}>
      <div style={styles.metricHeader}>
        <span style={styles.metricIcon}>{icon}</span>
        <span style={styles.metricTitle}>{title}</span>
        {trend && <span style={styles.trendBadge}>{trend}</span>}
      </div>
      <p style={styles.metricValue}>{value}</p>
      {deadline && <p style={styles.deadlineText}>⏰ {deadline}</p>}
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={styles.quickAction}>
      <span style={styles.quickActionIcon}>{icon}</span>
      <span style={styles.quickActionLabel}>{label}</span>
    </button>
  );
}

function LegendItem({ color, label, value }) {
  return (
    <div style={styles.legendItem}>
      <span style={{...styles.legendDot, backgroundColor: color}} />
      <span style={styles.legendLabel}>{label}</span>
      <span style={styles.legendValue}>{value}</span>
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
    padding: '12px 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px'
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
    gap: '4px',
    '@media (min-width: 1024px)': { display: 'flex' }
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
  syncStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#6B7280'
  },
  syncDot: { color: '#10B981', fontSize: '10px' },
  refreshButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px'
  },
  main: {
    flex: 1,
    padding: '24px'
  },
  contentWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
    '@media (min-width: 1200px)': {
      gridTemplateColumns: '240px 1fr'
    }
  },
  sidebar: {
    display: 'none',
    flexDirection: 'column',
    gap: '20px',
    '@media (min-width: 1200px)': { display: 'flex' }
  },
  sidebarSection: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  sidebarTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 12px 0'
  },
  periodTabs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  tabButton: {
    padding: '8px 12px',
    fontSize: '14px',
    textAlign: 'left',
    color: '#6B7280',
    background: 'none',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  tabActive: {
    padding: '8px 12px',
    fontSize: '14px',
    textAlign: 'left',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  quickActionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  quickAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#374151',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left'
  },
  quickActionIcon: { fontSize: '18px' },
  quickActionLabel: { flex: 1 },
  alertsCard: {
    backgroundColor: '#FFFBEB',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #FCD34D'
  },
  alertItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 0'
  },
  alertIcon: { fontSize: '16px' },
  alertText: {
    fontSize: '13px',
    color: '#92400E',
    margin: 0,
    lineHeight: 1.4
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  metricsSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(4, 1fr)'
    }
  },
  metricCard: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  metricIcon: { fontSize: '20px' },
  metricTitle: {
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: '500',
    flex: 1
  },
  trendBadge: {
    fontSize: '12px',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 4px 0'
  },
  deadlineText: {
    fontSize: '12px',
    color: '#F59E0B',
    margin: 0
  },
  chartsSection: {
    display: 'none',
    gridTemplateColumns: '1fr',
    gap: '24px',
    '@media (min-width: 1024px)': {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr'
    }
  },
  chartCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0
  },
  chartSelect: {
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    backgroundColor: 'white'
  },
  chartPlaceholder: {
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: '8px'
  },
  chartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    height: '160px',
    padding: '0 8px'
  },
  chartBar: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s'
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#9CA3AF'
  },
  piePlaceholder: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    height: '200px'
  },
  pieChart: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    position: 'relative',
    background: 'conic-gradient(#3B82F6 0deg 120deg, #10B981 120deg 240deg, #F59E0B 240deg 360deg)'
  },
  pieLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px'
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px'
  },
  legendLabel: { flex: 1, color: '#6B7280' },
  legendValue: { fontWeight: '500', color: '#1F2937' },
  transactionsSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #F3F4F6'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0
  },
  viewAllButton: {
    fontSize: '14px',
    color: '#4F46E5',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    textAlign: 'left',
    padding: '12px 20px',
    fontWeight: '600',
    color: '#6B7280',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB'
  },
  tr: {
    borderBottom: '1px solid #F3F4F6'
  },
  td: {
    padding: '12px 20px',
    color: '#374151'
  },
  categoryBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    fontWeight: '500'
  },
  taxCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #C7D2FE'
  },
  taxCardContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  taxIcon: { fontSize: '32px' },
  taxContent: { flex: 1, minWidth: '200px' },
  taxTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 4px 0'
  },
  taxText: {
    fontSize: '14px',
    color: '#4B5563',
    margin: 0,
    lineHeight: 1.4
  },
  payButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};