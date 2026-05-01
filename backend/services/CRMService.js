// backend/services/crmService.js

/**
 * Отправляет данные пользователя в Bitrix24 CRM
 * @param {Object} userData - Данные из формы регистрации
 * @returns {Promise<Object>} Ответ от Bitrix24 API
 */
export async function sendUserToCRM(userData) {
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;
  
  // Если вебхук не настроен — пропускаем отправку
  if (!webhookUrl) {
    console.log('⚠️ Bitrix24 webhook not configured - skipping CRM sync');
    return { skipped: true, reason: 'BITRIX24_WEBHOOK_URL not set' };
  }

  try {
    // Маппинг полей: ФинТап → Bitrix24
    const crmFields = {
      // Стандартные поля Bitrix24
      NAME: userData.name || 'Пользователь ФинТап',
      PHONE: [{ VALUE: userData.phone, VALUE_TYPE: 'WORK' }],
      
      // Кастомные поля (настраиваются в ПР-05)
      [process.env.BITRIX24_USER_FIELD_INN]: userData.inn,
      [process.env.BITRIX24_USER_FIELD_USN]: userData.usn_mode,
      [process.env.BITRIX24_USER_FIELD_SOURCE]: 'fintap_mvp',
      
      // Дополнительные поля для отладки
      COMMENTS: `Регистрация через ФинТап ${new Date().toISOString()}\nУСН: ${userData.usn_mode}`,
      SOURCE_ID: 'fintap',
      SOURCE_DESCRIPTION: 'Мобильное приложение для селлеров'
    };

    const payload = {
      fields: crmFields,
      params: { REGISTER_SONET_EVENT: 'Y' } // Создать событие в ленте
    };

    const entityType = process.env.BITRIX24_ENTITY_TYPE || 'contact';
    
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

    console.log('✅ User sent to CRM:', { 
      userId: userData.id || 'new', 
      crmId: result.result 
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to send to CRM:', error);
    // Не пробрасываем ошибку — регистрация не должна ломаться из-за CRM
    return { error: error.message, synced: false };
  }
}

export default { sendUserToCRM };