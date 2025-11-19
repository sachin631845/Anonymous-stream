const express = require('express');
const Notification = require('../models/notification');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/notifications - list notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const memberId = req.user.id;
    const notifs = await Notification.find({ recipient: memberId })
      .populate('actor', 'username profile')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, data: notifs });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
});

// POST /api/notifications/mark-read - mark notifications as read (accepts array of ids)
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    const memberId = req.user.id;
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No ids provided' });
    }

    await Notification.updateMany({ _id: { $in: ids }, recipient: memberId }, { $set: { isRead: true } });

    res.json({ success: true, message: 'Marked read' });
  } catch (error) {
    console.error('Mark-read error:', error);
    res.status(500).json({ success: false, message: 'Error marking notifications' });
  }
});

module.exports = router;
