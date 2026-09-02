const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    // 1. 获取请求头里的 Authorization 字段
    const authHeader = req.headers['authorization'];
    // Token 格式通常是 "Bearer <token>"，所以我们要把 "Bearer " 去掉
    const [scheme, token] = (authHeader || '').split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ success: false, message: '未提供认证 Token，请先登录' });
    }

    // 2. 验证 Token 是否合法
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token 无效或已过期' });
        }

        req.user = user;
        next(); // 放行，去执行下一个函数
    });
};

module.exports = authenticateToken;
