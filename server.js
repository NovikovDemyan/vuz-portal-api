const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express(); // Сначала создаем app

app.use(express.json());

// Разрешаем запросы только с твоего фронтенда
app.use(cors({
    origin: 'https://vuz-portal-frontend.onrender.com', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Инициализация БД (выполняется один раз при запуске)
const initDB = async () => {
    try {
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
app.listen(PORT, () => console.log(`Сервер на порту ${PORT}`));