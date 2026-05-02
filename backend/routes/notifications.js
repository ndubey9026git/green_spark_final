const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole');
const Notification = require('../models/Notification');

// Get notifications for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error while fetching notifications.' });
  }
});

// Get unread notification count for the logged-in user
router.get('/count', auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });
    res.json({ unread: unreadCount });
  } catch (err) {
    console.error('Error fetching notification count:', err);
    res.status(500).json({ error: 'Server error while fetching notification count.' });
  }
});

// Mark a notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Server error while updating notification.' });
  }
});

// Send notifications to one or more students (Teacher/Admin)
router.post('/send', auth, checkRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { recipients, title, message, type, link } = req.body;
    if (!recipients || !title || !message) {
      return res.status(400).json({ error: 'recipients, title, and message are required.' });
    }

    const recipientIds = Array.isArray(recipients) ? recipients : [recipients];
    const notifications = recipientIds.map((recipientId) => ({
      recipient: recipientId,
      sender: req.user.id,
      title,
      message,
      type: type || 'announcement',
      link: link || null,
    }));

    const created = await Notification.insertMany(notifications);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error sending notifications:', err);
    res.status(500).json({ error: 'Server error while sending notifications.' });
  }
});

module.exports = router;
