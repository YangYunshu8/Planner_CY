const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { cleanText, normalizeEmail, isValidEmail } = require('../utils/validation');
require('dotenv').config();

const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;


// 1. 用户注册接口逻辑

const register = async (req, res) => {
    try {
        const username = cleanText(req.body.username, 80);
        const email = normalizeEmail(req.body.email);
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        // 1. 检查有没有漏填信息
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: '请填写完整信息' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: '邮箱格式不正确' });
        }
        if (!STRONG_PASSWORD_PATTERN.test(password)) {
            return res.status(400).json({ success: false, message: '密码必须为 8–72 个字符，并包含大写字母、小写字母和数字' });
        }

        // 2. 检查邮箱是否已经被注册过
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, message: '该邮箱已被注册' });
        }

        // 3. 密码加密 (Bcrypt) - 加盐(salt) 10 次
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. 将新用户存入数据库
        const [result] = await db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: '注册成功！',
            data: { userId: result.insertId, username, email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

// 2. 用户登录接口逻辑

const login = async (req, res) => {
    try {
        const login = cleanText(req.body.login || req.body.email || req.body.username, 254);
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!login || !password) {
            return res.status(400).json({ success: false, message: '请填写用户名或邮箱和密码' });
        }

        // 1. 查找用户
        const [users] = await db.query(
            'SELECT user_id, username, email, password FROM users WHERE email = ? OR username = ? LIMIT 1',
            [login.toLowerCase(), login]
        );
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: '用户名/邮箱或密码错误' });
        }

        const user = users[0];

        // 2. 比对密码 (将前端传来的明文与数据库里的密文进行比对)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: '用户名/邮箱或密码错误' });
        }

        // 3. 签发 JWT Token
        // 把 user_id 藏在 Token 里，设置过期时间为 7 天
        const token = jwt.sign(
            { user_id: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: '登录成功！',
            data: {
                token,
                user: {
                    userId: user.user_id,
                    username: user.username,
                    email: user.email
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

const getMe = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, username, email FROM users WHERE user_id = ? LIMIT 1',
            [req.user.user_id]
        );
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        const user = users[0];
        res.json({
            success: true,
            data: { userId: user.user_id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

const deleteMe = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [req.user.user_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        // Related events, todos, habits and habit logs are removed by ON DELETE CASCADE.
        res.json({ success: true, message: '账号及其所有数据已删除' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

module.exports = { register, login, getMe, deleteMe };
