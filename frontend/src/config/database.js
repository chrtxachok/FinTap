// src/config/database.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Создаём клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'fintap-backend/1.0.0'
    }
  }
});

// Функция для проверки подключения
export const checkDatabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error) throw error;
    return { connected: true };
  } catch (err) {
    console.error('Database connection error:', err);
    return { connected: false, error: err.message };
  }
};

export default supabase;