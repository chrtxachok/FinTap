Мобильное приложение упрощённой бухгалтерии для ИП на УСН (Wildberries, Ozon). Расчёт налогов, учёт доходов/расходов, защита от штрафов ФНС.
✨ Возможности MVP
✅ Регистрация без SMS (быстрый вход по телефону)
✅ Добавление транзакций вручную
✅ Дашборд с метриками (Сегодня / Налог / Остаток)
✅ Расчёт налогов УСН 6% / 15%
✅ Адаптивный дизайн (Mobile + Desktop)

🛠 Стек
Frontend - React + Vite
Backend - Node.js + Express
База данных - Supabase (PostgreSQL)
Деплой - Vercel + Railway

🌐 Демо
Frontend
https://fintap-mvp.vercel.app
Backend
https://fintap-production.up.railway.app

API Endpoints
Метод
URL
Описание
POST - /api/v1/users - Регистрация
GET - /api/v1/users/:id - Профиль
POST - /api/v1/users/check - Проверка телефона
GET - /api/v1/transactions/:user_id - Список транзакций
POST - /api/v1/transactions - Создать транзакцию
GET - /api/v1/dashboard/:user_id - Метрики дашборда
GET - /health - Health check
