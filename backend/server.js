// backend/server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(new Error('CORS blocked'));
  },
  credentials: true
}));

// Supabase client (используем service role для обхода RLS в MVP)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === USERS ===

// POST /api/v1/users/check - Проверка существования пользователя
app.post('/api/v1/users/check', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Некорректный телефон' });
    }
    
    const {  user, error } = await supabase
      .from('users')
      .select('id, phone, inn, usn_mode, name')
      .eq('phone', phone)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Check user error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Обновить endpoint регистрации (добавить проверку дубликатов):
app.post('/api/v1/users', async (req, res) => {
  try {
    const { phone, inn, usn_mode, name } = req.body;
    
    // Валидация
    if (!phone || phone.length < 10) return res.status(400).json({ error: 'Некорректный телефон' });
    if (!inn || inn.length !== 12) return res.status(400).json({ error: 'ИНН должен содержать 12 цифр' });
    
    // Проверка на дубликат
    const {  existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();
    
    if (existing) {
      return res.status(400).json({ 
        error: 'Пользователь с таким телефоном уже существует. Используйте быстрый вход.' 
      });
    }
    
    // Создание
    const {  data, error } = await supabase
      .from('users')
      .insert([{ 
        phone, 
        inn, 
        usn_mode, 
        name: name || 'Пользователь', 
        is_active: true 
      }])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Получение профиля
app.get('/api/v1/users/:id', async (req, res) => {
  try {
    const {  data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// === TRANSACTIONS ===
// Добавить транзакцию
app.post('/api/v1/transactions', async (req, res) => {
  try {
    const { user_id, date, amount, category, counterparty } = req.body;
    
    if (!user_id || !amount) return res.status(400).json({ error: 'user_id и amount обязательны' });
    
    const {  data, error } = await supabase
      .from('transactions')
      .insert([{ 
        user_id, 
        date: date || new Date().toISOString().split('T')[0],
        amount, 
        category: category || 'income',
        counterparty: counterparty || 'Не указано',
        status: 'confirmed'
      }])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Transaction error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Получить транзакции пользователя
app.get('/api/v1/transactions/:user_id', async (req, res) => {
  try {
    const {  data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.params.user_id)
      .order('date', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// === DASHBOARD METRICS ===
// Получить метрики для дашборда
app.get('/api/v1/dashboard/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Получаем транзакции
    const {  txs, error } = await supabase
      .from('transactions')
      .select('amount, category, date')
      .eq('user_id', user_id);
    
    if (error) throw error;
    
    // Считаем метрики
    const today = new Date().toISOString().split('T')[0];
    const todayTxs = txs?.filter(t => t.date === today) || [];
    
    const income = todayTxs.filter(t => t.category === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = todayTxs.filter(t => t.category === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const net = income - expense;
    const tax = net * 0.06; // УСН 6%
    
    res.json({
      today_income: income,
      today_expense: expense,
      net_today: net,
      tax_estimate: tax,
      transaction_count: txs?.length || 0
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Запуск
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});