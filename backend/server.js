// backend/server.js — ПОЛНЫЙ КОД С ES MODULE СИНТАКСИСОМ
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE ===
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

// === SUPABASE CLIENT ===
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// === CRM SERVICE (встроено) ===
async function sendUserToCRM(userData) {
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('⚠️ Bitrix24 webhook not configured - skipping CRM sync');
    return { skipped: true, reason: 'BITRIX24_WEBHOOK_URL not set' };
  }

  try {
    /*
    const crmFields = {
      NAME: userData.name || 'Пользователь ФинТап',
      PHONE: [{ VALUE: userData.phone, VALUE_TYPE: 'WORK' }],
      UF_CRM_INN: userData.inn,
      UF_CRM_USN_MODE: userData.usn_mode,
      UF_CRM_SOURCE: 'fintap_mvp',
      COMMENTS: `Регистрация через ФинТап ${new Date().toISOString()}\nУСН: ${userData.usn_mode}`,
      SOURCE_ID: 'fintap'
    };
    */
    
    const crmFields = {
  NAME: userData.name || 'Пользователь ФинТап',
  PHONE: [{ VALUE: userData.phone, VALUE_TYPE: 'WORK' }],
  COMMENTS: `ИНН: ${userData.inn}\nУСН: ${userData.usn_mode}\nИсточник: fintap_mvp`
};
    const payload = {
      fields: crmFields,
      params: { REGISTER_SONET_EVENT: 'Y' }
    };

    const entityType = 'contact';
    
    const response = await fetch(`${webhookUrl}/crm.${entityType}.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
      console.error('❌ Bitrix24 API error:', result.error_description);
      throw new Error(result.error_description || 'Bitrix24 API error');
    }

    console.log('✅ User sent to CRM:', { userId: userData.id, crmId: result.result });
    return result;
    
  } catch (error) {
    console.error('❌ Failed to send to CRM:', error.message);
    return { error: error.message, synced: false };
  }
}

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === USERS ===

// POST /api/v1/users/check - Проверка существования
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
      .maybeSingle();
    
    if (error) throw error;
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Check user error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/v1/users - Регистрация (с отправкой в CRM)
app.post('/api/v1/users', async (req, res) => {
  try {
    const { phone, inn, usn_mode, name } = req.body;
    
    if (!phone || phone.length < 10) return res.status(400).json({ error: 'Некорректный телефон' });
    if (!inn || inn.length !== 12) return res.status(400).json({ error: 'ИНН должен содержать 12 цифр' });
    
    const {  existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingError) throw existingError;
    
    if (existing) {
      return res.status(400).json({ 
        error: 'Пользователь с таким телефоном уже существует. Используйте быстрый вход.' 
      });
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        phone, 
        inn, 
        usn_mode, 
        name: name || 'Пользователь', 
        is_active: true 
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // 🎯 ОТПРАВКА В CRM — АСИНХРОННО
    sendUserToCRM({
      id: data.id,
      name: data.name,
      phone: data.phone,
      inn: data.inn,
      usn_mode: data.usn_mode
    }).catch(err => {
      console.error('CRM sync failed (non-blocking):', err);
    });
    
    res.status(201).json(data);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/v1/users/:id - Профиль
app.get('/api/v1/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// === TRANSACTIONS ===
app.post('/api/v1/transactions', async (req, res) => {
  try {
    const { user_id, date, amount, category, counterparty } = req.body;
    
    if (!user_id || !amount) return res.status(400).json({ error: 'user_id и amount обязательны' });
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ 
        user_id, 
        date: date || new Date().toISOString().split('T')[0],
        amount, 
        category: category || 'income',
        counterparty: counterparty || 'Не указано',
        status: 'confirmed'
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Transaction error:', err);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/v1/transactions/:user_id', async (req, res) => {
  try {
    const { data, error } = await supabase
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
app.get('/api/v1/dashboard/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const {  txs, error } = await supabase
      .from('transactions')
      .select('amount, category, date')
      .eq('user_id', user_id);
    
    if (error) throw error;
    
    const today = new Date().toISOString().split('T')[0];
    const todayTxs = txs?.filter(t => t.date === today) || [];
    
    const income = todayTxs.filter(t => t.category === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = todayTxs.filter(t => t.category === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const net = income - expense;
    const tax = net * 0.06;
    
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

// === ЗАПУСК СЕРВЕРА ===
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});