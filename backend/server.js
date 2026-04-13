// backend/server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

// === ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ===
const app = express();  // ← ЭТОЙ СТРОКИ НЕ ХВАТАЛО!

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Разрешаем запросы без origin
  
  // Разрешаем все Vercel preview-домены
  if (origin.includes('.vercel.app')) return true;
  
  // Разрешаем локальную разработку
  if (origin.includes('localhost')) return true;
  
  // Разрешаем конкретный продакшен-домен (если есть)
  const productionOrigins = [
    'https://fintap-mvp.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  return productionOrigins.includes(origin);
};

app.use(cors({
  origin: isAllowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/*
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
*/

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    node_version: process.version,
    uptime: process.uptime()
  });
});

// Проверка подключения к Supabase (не блокирующая)
const checkSupabase = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 сек таймаут
    
    const { error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .signal(controller.signal);
    
    clearTimeout(timeout);
    
    if (error) {
      console.warn('⚠️ Supabase connection warning:', error.message);
    } else {
      console.log('✅ Supabase connected');
    }
  } catch (err) {
    console.warn('⚠️ Supabase check failed (non-blocking):', err.message);
  }
};

// Запускаем проверку, но НЕ ждём её завершения
checkSupabase(); // ← Без await!

// === USERS ===
// POST /api/v1/users - Регистрация
app.post('/api/v1/users', async (req, res) => {
  try {
    const { phone, inn, usn_mode, name, crm_id } = req.body;
    
    // Валидация
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Некорректный телефон' });
    }
    if (!inn || inn.length !== 12) {
      return res.status(400).json({ error: 'ИНН должен содержать 12 цифр' });
    }
    if (!usn_mode || !['доходы', 'доходы_расходы'].includes(usn_mode)) {
      return res.status(400).json({ error: 'Некорректный режим УСН' });
    }
    
    // Проверка на существующего пользователя
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();
    
    if (existing) {
      return res.status(200).json({ 
        ...existing, 
        message: 'Пользователь уже существует' 
      });
    }
    
    // Создание пользователя
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        phone, 
        inn, 
        usn_mode, 
        name: name || 'Пользователь',
        crm_id,
        crm_status: 'new',
        is_active: true 
      }])
      .select();
    
    if (error) throw error;
    
    // Webhook для CRM (ПР-08)
    if (process.env.CRM_WEBHOOK_URL) {
      fetch(process.env.CRM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event: 'user_created', 
          data: data[0] 
        })
      }).catch(err => console.log('CRM webhook error:', err));
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Registration error:', error);
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
// POST /api/v1/accounts - Подключение счёта
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
// POST /api/v1/transactions - Создание транзакции
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

// GET /api/v1/transactions/:user_id - Список транзакций
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

// PUT /api/v1/transactions/:id - Обновление транзакции
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

// POST /api/v1/transactions/:id/confirm - Подтверждение транзакции
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
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// === ЗАПУСК СЕРВЕРА ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Node.js version: ${process.version}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});