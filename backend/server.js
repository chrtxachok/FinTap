// backend/server.js — МИНИМАЛЬНЫЙ РАБОЧИЙ ВАРИАНТ
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

// === ИНИЦИАЛИЗАЦИЯ ===
const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE ===
app.use(express.json()); // ← ОБЯЗАТЕЛЬНО для парсинга JSON
app.use(async (req, res, next) => {
  const timeout = setTimeout(() => {
    res.status(408).json({ error: 'Request timeout' });
  }, 10000); // 10 сек
  
  req.on('end', () => clearTimeout(timeout));
  next();
});

// CORS — разрешаем Vercel preview-домены
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin.includes('.vercel.app')) return true;
  if (origin.includes('localhost')) return true;
  const productionOrigins = ['https://fintap-mvp.vercel.app', process.env.FRONTEND_URL].filter(Boolean);
  return productionOrigins.includes(origin);
};

app.use(cors({
  origin: isAllowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// === SUPABASE CLIENT ===
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// === HEALTH CHECK (ОБЯЗАТЕЛЬНО для Railway) ===
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    node_version: process.version
  });
});

// === USERS ===
app.post('/api/v1/users', async (req, res) => {
  try {
    const { phone, inn, usn_mode, name, crm_id } = req.body;
    
    console.log('📥 Registration request:', { phone, inn, usn_mode });
    
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
    const {  existing } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();
    
    if (existing) {
      return res.status(200).json({ ...existing, message: 'Пользователь уже существует' });
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
    
    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log('✅ User created:', data[0].id);
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/users/:id
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

// === ЗАПУСК СЕРВЕРА ===
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});