const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ФУНКЦИЯ СОЗДАНИЯ ТАБЛИЦЫ
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);
    
    // Добавляем тестового админа, если его нет
    await pool.query(`
      INSERT INTO users (username, password) 
      VALUES ('admin', '1234') 
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log("База данных готова к работе.");
  } catch (err) {
    console.error("Ошибка инициализации БД:", err);
  }
};

initDB(); // Запускаем проверку при старте сервера

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