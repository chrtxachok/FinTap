// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// === USERS ===
// POST /api/v1/users - Регистрация (US1, US2, US4)
app.post('/api/v1/users', async (req, res) => {
  try {
    const { phone, inn, usn_mode, name, crm_id } = req.body;
    const { data, error } = await supabase
      .from('users')
      .insert([{ phone, inn, usn_mode, name, crm_id }])
      .select();
    
    if (error) throw error;
    
    // Webhook для CRM (ПР-08)
    if (process.env.CRM_WEBHOOK_URL) {
      fetch(process.env.CRM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'user_created', data: data[0] })
      });
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/users/:id - Профиль пользователя
app.get('/api/v1/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === ACCOUNTS ===
// POST /api/v1/accounts - Подключение счёта (US3)
app.post('/api/v1/accounts', async (req, res) => {
  try {
    const { user_id, account_number, bank_name, type, balance } = req.body;
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ user_id, account_number, bank_name, type, balance }])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === TRANSACTIONS ===
// POST /api/v1/transactions - Создание транзакции (US9, US10)
app.post('/api/v1/transactions', async (req, res) => {
  try {
    const { user_id, date, amount, category, counterparty, vat, ai_flags } = req.body;
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ user_id, date, amount, category, counterparty, vat, ai_flags }])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/transactions/:user_id - Список транзакций (ПР-03 Endpoint #1)
app.get('/api/v1/transactions/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { from, to, type } = req.query;
    
    let query = supabase.from('transactions').select('*').eq('user_id', user_id);
    
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (type) query = query.eq('category', type);
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/transactions/:id - Обновление транзакции (ПР-03 Endpoint #3)
app.put('/api/v1/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, counterparty, vat } = req.body;
    const { data, error } = await supabase
      .from('transactions')
      .update({ amount, category, counterparty, vat })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/transactions/:id/confirm - Подтверждение (ПР-03 Endpoint #4)
app.post('/api/v1/transactions/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('transactions')
      .update({ status: 'confirmed', confirmed_at: new Date() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === WEBHOOKS ===
// POST /api/v1/webhooks/crm - Webhook для CRM (ПР-08)
app.post('/api/v1/webhooks/crm', async (req, res) => {
  try {
    const { event, data } = req.body;
    console.log('CRM Webhook:', event, data);
    // Логика синхронизации с CRM
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});