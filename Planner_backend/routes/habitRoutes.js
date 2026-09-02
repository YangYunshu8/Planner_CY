const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const authenticateToken = require('../middlewares/authMiddleware');

// 所有 Habit 路由都需要验证 Token
router.use(authenticateToken);

router.get('/', habitController.getHabits);
router.post('/', habitController.createHabit);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);

// 日志相关路由
router.get('/logs', habitController.getHabitLogs); // 注意：把查询 logs 放在独立路径更符合 RESTful
router.post('/:id/logs', habitController.createHabitLog);
router.delete('/:id/logs/:date', habitController.deleteHabitLog);

module.exports = router;