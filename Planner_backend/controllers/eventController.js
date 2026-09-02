const db = require('../config/database');
const { cleanText, isValidColor, isValidDate, isValidTime } = require('../utils/validation');

function validateEventInput(body) {
    const title = cleanText(body.title, 200);
    const details = cleanText(body.details || '', 1000);
    const eventDate = body.event_date;
    const startTime = body.start_time || null;
    const endTime = body.end_time || null;
    const colour = body.colour || '#F2D7D9';
    if (!title) return { error: '标题是必填项' };
    if (!eventDate || !isValidDate(eventDate)) return { error: '日期格式不正确' };
    if (!isValidTime(startTime) || !isValidTime(endTime)) return { error: '时间格式不正确' };
    if (startTime && endTime && startTime >= endTime) return { error: '结束时间必须晚于开始时间' };
    if (!isValidColor(colour)) return { error: '颜色格式不正确' };
    return { title, details, eventDate, startTime, endTime, colour };
}

const createEvent = async (req, res) => {
    try {
        const input = validateEventInput(req.body);
        if (input.error) return res.status(400).json({ success: false, message: input.error });
        const [result] = await db.query(
            `INSERT INTO events (user_id, title, details, event_date, start_time, end_time, colour)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.user_id, input.title, input.details, input.eventDate,
                input.startTime, input.endTime, input.colour]
        );
        res.status(201).json({ success: true, message: '日程创建成功！', data: { event_id: result.insertId } });
    } catch (error) {
        console.error('创建日程失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

const getEvents = async (req, res) => {
    try {
        const { start, end } = req.query;
        const values = [req.user.user_id];
        let dateFilter = '';
        if (start || end) {
            if (!start || !end || !isValidDate(start) || !isValidDate(end) || start > end) {
                return res.status(400).json({ success: false, message: '日期范围不正确' });
            }
            dateFilter = ' AND event_date BETWEEN ? AND ?';
            values.push(start, end);
        }
        const [events] = await db.query(
            `SELECT id, title, details, event_date, start_time, end_time, colour,
                    created_at, updated_at
             FROM events WHERE user_id = ?${dateFilter}
             ORDER BY event_date ASC, start_time ASC, created_at ASC`,
            values
        );
        res.json({ success: true, message: '获取日程成功', data: events });
    } catch (error) {
        console.error('获取日程失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

const updateEvent = async (req, res) => {
    try {
        const input = validateEventInput(req.body);
        if (input.error) return res.status(400).json({ success: false, message: input.error });
        const [result] = await db.query(
            `UPDATE events SET title = ?, details = ?, event_date = ?, start_time = ?, end_time = ?, colour = ?
             WHERE id = ? AND user_id = ?`,
            [input.title, input.details, input.eventDate, input.startTime, input.endTime,
                input.colour, req.params.id, req.user.user_id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: '日程不存在' });
        res.json({ success: true, message: '日程更新成功', data: { event_id: Number(req.params.id) } });
    } catch (error) {
        console.error('更新日程失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM events WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.user_id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: '日程不存在' });
        res.json({ success: true, message: '日程删除成功', data: { event_id: Number(req.params.id) } });
    } catch (error) {
        console.error('删除日程失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

module.exports = { createEvent, getEvents, updateEvent, deleteEvent };
