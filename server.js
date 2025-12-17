const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// 1. Сначала создаем приложение (Инициализация)
const app = express(); 

// 2. Теперь настраиваем посредников (Middleware)
app.use(express.json());

// Настройка CORS (теперь 'app' уже существует и ошибки не будет)
app.use(cors({
    origin: 'https://vuz-portal-frontend.onrender.com', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// 3. Подключение к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 4. Инициализация таблицы (тот самый код с DROP, если нужно исправить колонку)
const initDB = async () => {
  try {
    // Включай DROP TABLE только если всё еще видна ошибка "column does not exist"
    // await pool.query('DROP TABLE IF EXISTS users CASCADE;'); 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);
    console.log("База данных готова.");
  } catch (err) {
    console.error("Ошибка БД:", err);
  }
};
initDB();

// 5. Роуты (Логика)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            res.json({ success: true, message: `Привет, ${username}!` });
        } else {
            res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));