// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddTransaction from './AddTransaction';

export default function Dashboard() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const usnMode = localStorage.getItem('usnMode') || 'доходы';
  
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

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

  if (loading && !metrics) return <div className="container text-center" style={{paddingTop: 40}}>Загрузка...</div>;

  return (
    <div className="container-wide">
      {/* Sidebar для ПК */}
      <aside className="sidebar" style={{display: 'none'}}>@media (min-width: 1024px)</aside>
      
      <main style={{flex: 1}}>
        {/* Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
          <h1 style={{fontSize: 20, fontWeight: 700}}>📊 Дашборд</h1>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'}}>Выйти</button>
        </div>

        {/* Метрики */}
        {metrics && (
          <div className="grid-2" style={{marginBottom: 24}}>
            <div className="card" style={{borderLeft: '4px solid var(--success)'}}>
              <p style={{fontSize: 13, color: 'var(--text-muted)'}}>Сегодня</p>
              <p style={{fontSize: 22, fontWeight: 700, margin: '4px 0'}}>{formatMoney(metrics.net_today)}</p>
              <p style={{fontSize: 12, color: metrics.net_today >= 0 ? 'var(--success)' : 'var(--error)'}}>
                {metrics.net_today >= 0 ? '↑' : '↓'} {formatMoney(Math.abs(metrics.today_income - metrics.today_expense))}
              </p>
            </div>
            <div className="card" style={{borderLeft: '4px solid var(--accent)'}}>
              <p style={{fontSize: 13, color: 'var(--text-muted)'}}>Налог ({usnMode === 'доходы' ? '6%' : '15%'})</p>
              <p style={{fontSize: 22, fontWeight: 700, margin: '4px 0'}}>{formatMoney(metrics.tax_estimate)}</p>
              <p style={{fontSize: 12, color: 'var(--text-muted)'}}>Оценка на сегодня</p>
            </div>
          </div>
        )}

        {/* Кнопка добавления */}
        <button className="btn" onClick={() => setShowAdd(true)} style={{marginBottom: 24}}>+ Добавить транзакцию</button>

        {/* Список транзакций */}
        <div className="card">
          <h3 style={{fontSize: 16, fontWeight: 600, marginBottom: 12}}>Последние операции</h3>
          {transactions.length === 0 ? (
            <p style={{color: 'var(--text-muted)', textAlign: 'center', padding: 20}}>Нет операций. Добавьте первую!</p>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)'}}>
                  <div>
                    <p style={{fontWeight: 500}}>{tx.counterparty}</p>
                    <p style={{fontSize: 13, color: 'var(--text-muted)'}}>{new Date(tx.date).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <span style={{fontWeight: 600, color: tx.category === 'income' ? 'var(--success)' : 'var(--error)'}}>
                    {tx.category === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Модальное окно добавления */}
      {showAdd && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100}} onClick={() => setShowAdd(false)}>
          <div className="card" style={{maxWidth: 400, width: '90%', margin: 20}} onClick={e => e.stopPropagation()}>
            <AddTransaction userId={userId} onSuccess={() => { setShowAdd(false); loadData(); }} onClose={() => setShowAdd(false)} />
          </div>
        </div>
      )}
    </div>
  );
}