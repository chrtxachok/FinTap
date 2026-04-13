// backend/server.js — МИНИМАЛЬНЫЙ РАБОЧИЙ ВАРИАНТ
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

// === ИНИЦИАЛИЗАЦИЯ ===
const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE (ПОРЯДОК ВАЖЕН!) ===
// 1. CORS — ДО всех маршрутов, с обработкой preflight
app.use(cors({
  origin: function(origin, callback) {
    // Разрешаем запросы без origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Разрешаем все Vercel домены (preview + production)
    if (origin.includes('.vercel.app')) return callback(null, true);
    
    // Разрешаем localhost для разработки
    if (origin.includes('localhost')) return callback(null, true);
    
    // Разрешаем конкретные домены из env
    const allowed = [process.env.FRONTEND_URL].filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    
    // Блокируем всё остальное
    console.log('❌ CORS blocked:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 2. Парсинг JSON — ОБЯЗАТЕЛЬНО перед маршрутами
app.use(express.json());

// 3. Логирование запросов для отладки
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} from ${req.headers.origin || 'no-origin'}`);
  next();
});

// === SUPABASE CLIENT ===
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// === HEALTH CHECK (ОБЯЗАТЕЛЬНО для Railway) ===
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    node_version: process.version,
    env: process.env.NODE_ENV
  });
});

// === OPTIONS HANDLER для preflight запросов ===
app.options('*', (req, res) => {
  console.log('🔍 OPTIONS preflight:', req.path);
  res.sendStatus(200);
});

// === USERS ===
app.post('/api/v1/users', async (req, res) => {
  console.log('📥 Registration request body:', req.body);
  
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
      console.error('❌ Supabase error:', error);
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
// Слушаем ВСЕ интерфейсы (0.0.0.0), а не только localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🌍 Listening on 0.0.0.0:${PORT}`);
});

// === ОБРАБОТЧИКИ ОШИБОК ПРОЦЕССА (чтобы не падал молча) ===
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Не завершаем процесс — даём Railway перезапустить
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown для Railway
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});