const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
require('dotenv').config();

const app = express();

const allowedOrigin = process.env.CLIENT_ORIGIN;
app.disable('x-powered-by');
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : undefined));
app.use(express.json({ limit: '100kb' }));

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: "The backend server is operating normally!" });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ success: true, message: "MySQL database connection successful!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database connection failed", error: error.message });
    }
});


const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const todoRoutes = require('./routes/todoRoutes');
const habitRoutes = require('./routes/habitRoutes');


app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/habits', habitRoutes);

// 同一个服务器同时提供前端页面，避免本地打开 HTML 时产生跨域问题。
const webDirectory = path.join(__dirname, '..', 'Web9');
app.use(express.static(webDirectory));
app.get('/', (_req, res) => res.redirect('/Dashboard.html'));

app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`The server has been successfully started and is now listening on port: ${PORT}`);
});
