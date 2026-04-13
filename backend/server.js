// POST /api/v1/users - Регистрация (обновлённая версия)
app.post('/api/v1/users', async (req, res) => {
  try {
    const { phone, inn, usn_mode, name, crm_id } = req.body;
    
    // Простая валидация
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
      // Возвращаем существующего пользователя
      return res.status(200).json({ 
        ...existing, 
        message: 'Пользователь уже существует' 
      });
    }
    
    // Создаём нового пользователя
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