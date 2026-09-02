const db = require('../config/database');
const { cleanText, isValidColor, isValidDate, toBoolean } = require('../utils/validation');

function validateTodoInput(body) {
    const title = cleanText(body.title, 200);
    const color = body.color || '#F2D7D9';
    const dueDate = body.due_date || null;
    if (!title) return { error: 'Title is required' };
    if (!isValidColor(color)) return { error: 'Invalid color' };
    if (!isValidDate(dueDate)) return { error: 'Invalid due date' };
    return { title, color, dueDate };
}

// 获取所有 Todo[cite: 5]
const getTodos = async (req, res) => {
    try {
        const userId = req.user.user_id; // 替换了你朋友的 TEMP_USER_ID
        const [todos] = await db.query(
            `SELECT id, title, color, due_date, is_done, created_at, updated_at 
             FROM todos WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );
        res.status(200).json({ success: true, message: 'Todos retrieved successfully', data: todos });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to get todos: ${error.message}` });
    }
};

// 创建 Todo[cite: 5]
const createTodo = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const input = validateTodoInput(req.body);
        if (input.error) return res.status(400).json({ success: false, message: input.error });

        const [result] = await db.query(
            `INSERT INTO todos (user_id, title, color, due_date, is_done) VALUES (?, ?, ?, ?, false)`,
            [userId, input.title, input.color, input.dueDate]
        );
        res.status(201).json({ success: true, message: 'Todo created successfully', data: { todo_id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to create todo: ${error.message}` });
    }
};

// 更新 Todo[cite: 5]
const updateTodo = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;
        const input = validateTodoInput(req.body);
        if (input.error) return res.status(400).json({ success: false, message: input.error });

        const [result] = await db.query(
            `UPDATE todos SET title = ?, color = ?, due_date = ?, is_done = ? WHERE id = ? AND user_id = ?`,
            [input.title, input.color, input.dueDate, toBoolean(req.body.is_done), id, userId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Todo not found' });
        res.status(200).json({ success: true, message: 'Todo updated successfully', data: { todo_id: Number(id) } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to update todo: ${error.message}` });
    }
};

// 更新 Todo 状态 (打勾/取消)[cite: 5]
const patchTodoStatus = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;
        const { is_done } = req.body;

        const [result] = await db.query(
            `UPDATE todos SET is_done = ? WHERE id = ? AND user_id = ?`,
            [toBoolean(is_done), id, userId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Todo not found' });
        res.status(200).json({ success: true, message: 'Todo status updated', data: { todo_id: Number(id), is_done: toBoolean(is_done) } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to update status: ${error.message}` });
    }
};

// 删除 Todo[cite: 5]
const deleteTodo = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;
        const [result] = await db.query(`DELETE FROM todos WHERE id = ? AND user_id = ?`, [id, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Todo not found' });
        res.status(200).json({ success: true, message: 'Todo deleted successfully', data: { todo_id: Number(id) } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to delete todo: ${error.message}` });
    }
};

module.exports = { getTodos, createTodo, updateTodo, patchTodoStatus, deleteTodo };
