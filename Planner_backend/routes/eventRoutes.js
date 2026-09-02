const express = require('express');
const router = express.Router();
const { createEvent, getEvents, updateEvent, deleteEvent } = require('../controllers/eventController');
const authenticateToken = require('../middlewares/authMiddleware');

router.use(authenticateToken);

// 完整的 URL 会是：POST /api/events
router.post('/', createEvent);

// 完整的 URL 会是：GET /api/events
router.get('/', getEvents);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
