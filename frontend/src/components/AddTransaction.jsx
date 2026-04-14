// src/components/AddTransaction.jsx
import { useState } from 'react';

export default function AddTransaction({ userId, onSuccess, onClose }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', category: 'income', counterparty: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

    const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.amount || form.amount <= 0) { setError('Введите корректную сумму'); return; }
  
  setLoading(true);
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...form, amount: Number(form.amount) })
    });
    
    if (!res.ok) throw new Error('Ошибка сохранения');
    
    const newTransaction = await res.json();
    onSuccess?.(newTransaction); // ← ВОЗВРАЩАЕМ НОВУЮ ТРАНЗАКЦИЮ
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="flex-col">
      <h3 style={{fontSize: 18, fontWeight: 600, marginBottom: 16}}>Новая транзакция</h3>
      
      <label className="label">Дата</label>
      <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
      
      <label className="label">Сумма (₽)</label>
      <input className="input" type="number" placeholder="1000" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
      
      <label className="label">Тип</label>
      <div className="flex">
        <label style={{flex: 1, padding: 10, border: `2px solid ${form.category === 'income' ? 'var(--success)' : 'var(--border)'}`, borderRadius: 8, textAlign: 'center', cursor: 'pointer'}}>
          <input type="radio" name="cat" checked={form.category === 'income'} onChange={() => setForm({...form, category: 'income'})} style={{marginRight: 4}} /> Доход
        </label>
        <label style={{flex: 1, padding: 10, border: `2px solid ${form.category === 'expense' ? 'var(--error)' : 'var(--border)'}`, borderRadius: 8, textAlign: 'center', cursor: 'pointer'}}>
          <input type="radio" name="cat" checked={form.category === 'expense'} onChange={() => setForm({...form, category: 'expense'})} style={{marginRight: 4}} /> Расход
        </label>
      </div>
      
      <label className="label">Контрагент</label>
      <input className="input" type="text" placeholder="Wildberries, СДЭК..." value={form.counterparty} onChange={e => setForm({...form, counterparty: e.target.value})} />
      
      {error && <p className="error">{error}</p>}
      
      <div className="flex" style={{marginTop: 8}}>
        <button type="button" className="btn" onClick={onClose} style={{background: 'var(--border)', color: 'var(--text)'}}>Отмена</button>
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
      </div>
    </form>
  );
}