const db = require('../config/database');
const { cleanText, isValidColor, isValidDate } = require('../utils/validation');

function validateHabitInput(body) {
    const title = cleanText(body.title, 200);
    const color = body.color || '#B5C4A0';
    if (!title) return { error: 'Title is required' };
    if (!isValidColor(color)) return { error: 'Invalid color' };
    return { title, color };
}

// 获取所有 Habit[cite: 5]
const getHabits = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const [habits] = await db.query(
            `SELECT id, title, color, created_at, updated_at FROM habits WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );
        res.status(200).json({ success: true, message: 'Habits retrieved successfully', data: habits });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to get habits: ${error.message}` });
    }
};

// 创建 Habit[cite: 5]
const createHabit = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const input = validateHabitInput(req.body);
        if (input.error) return res.status(400).json({ success: false, message: input.error });

        const [result] = await db.query(
            `INSERT INTO habits (user_id, title, color) VALUES (?, ?, ?)`,
            [userId, input.title, input.color]
        );
        res.status(201).json({ success: true, message: 'Habit created', data: { habit_id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to create habit: ${error.message}` });
    }
};

// 更新 Habit[cite: 5]
const updateHabit = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;
        const input = validateHabitInput(req.body);
        if (input.error) return res.status(400).json({ success: false, message: input.error });

        const [result] = await db.query(
            `UPDATE habits SET title = ?, color = ? WHERE id = ? AND user_id = ?`,
            [input.title, input.color, id, userId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Habit not found' });
        res.status(200).json({ success: true, message: 'Habit updated', data: { habit_id: Number(id) } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to update habit: ${error.message}` });
    }
};

// 删除 Habit[cite: 5]
const deleteHabit = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;
        const [result] = await db.query(`DELETE FROM habits WHERE id = ? AND user_id = ?`, [id, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Habit not found' });
        res.status(200).json({ success: true, message: 'Habit deleted', data: { habit_id: Number(id) } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to delete habit: ${error.message}` });
    }
};

// 创建 Habit Log (打卡)[cite: 5]
const createHabitLog = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;
        const { completed_date } = req.body;
        if (!completed_date || !isValidDate(completed_date)) {
            return res.status(400).json({ success: false, message: 'A valid completed_date is required' });
        }

        const [habitRows] = await db.query(`SELECT id FROM habits WHERE id = ? AND user_id = ?`, [id, userId]);
        if (habitRows.length === 0) return res.status(404).json({ success: false, message: 'Habit not found' });

        await db.query(`INSERT IGNORE INTO habit_logs (habit_id, completed_date) VALUES (?, ?)`, [id, completed_date]);
        res.status(201).json({ success: true, message: 'Habit log created', data: { habit_id: Number(id), completed_date } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to create log: ${error.message}` });
    }
};

// 删除 Habit Log (取消打卡)[cite: 5]
const deleteHabitLog = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id, date } = req.params;
        const [result] = await db.query(
            `DELETE hl FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id WHERE hl.habit_id = ? AND hl.completed_date = ? AND h.user_id = ?`,
            [id, date, userId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Habit log not found' });
        res.status(200).json({ success: true, message: 'Habit log deleted', data: { habit_id: Number(id), completed_date: date } });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to delete log: ${error.message}` });
    }
};

// 获取 Habit Logs[cite: 5]
const getHabitLogs = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { start, end } = req.query;
        if (!start || !end || !isValidDate(start) || !isValidDate(end) || start > end) {
            return res.status(400).json({ success: false, message: 'A valid start and end date range is required' });
        }

        const [logs] = await db.query(
            `SELECT hl.id, hl.habit_id, DATE_FORMAT(hl.completed_date, '%Y-%m-%d') AS completed_date 
             FROM habit_logs hl JOIN habits h ON hl.habit_id = h.id 
             WHERE h.user_id = ? AND hl.completed_date BETWEEN ? AND ? ORDER BY hl.completed_date ASC`,
            [userId, start, end]
        );
        res.status(200).json({ success: true, message: 'Logs retrieved', data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: `Failed to get logs: ${error.message}` });
    }
};

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, createHabitLog, deleteHabitLog, getHabitLogs };
