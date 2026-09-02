const express = require('express');
const router = express.Router();
const { register, login, getMe, deleteMe } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/register', register);

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.delete('/me', authenticateToken, deleteMe);

module.exports = router;