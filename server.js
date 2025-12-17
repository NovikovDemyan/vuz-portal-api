const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());

// Настройка CORS: разрешаем доступ только твоему фронтенду
app.use(cors({
    origin: 'https://vuz-portal-frontend.onrender.com',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Инициализация базы данных
const initDB = async () => {
    try {
        // РАСКОММЕНТИРУЙ строку ниже, если получишь ошибку "column does not exist"
        // await pool.query('DROP TABLE IF EXISTS users CASCADE;'); 

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        `);
        console.log("База данных готова и структура обновлена.");
    } catch (err) {
        console.error("Ошибка при инициализации БД:", err);
    }
};
initDB();

// Маршрут регистрации
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING first_name',
            [firstName, lastName, email, password]
        );
        res.json({ success: true, message: `Пользователь ${result.rows[0].first_name} создан!` });
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ success: false, message: 'Этот email уже зарегистрирован' });
        } else {
            res.status(500).json({ success: false, message: 'Ошибка регистрации на сервере' });
        }
    }
});

// Маршрут входа
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT first_name FROM users WHERE email = $1 AND password = $2', 
            [email, password]
        );
        if (result.rows.length > 0) {
            res.json({ success: true, name: result.rows[0].first_name });
        } else {
            res.status(401).json({ success: false, message: 'Неверный email или пароль' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));