const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');
const authenticateToken = require('../middlewares/authMiddleware');

// 所有 Todo 路由都需要验证 Token
router.use(authenticateToken);

router.get('/', todoController.getTodos);
router.post('/', todoController.createTodo);
router.put('/:id', todoController.updateTodo);
router.patch('/:id/done', todoController.patchTodoStatus);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;