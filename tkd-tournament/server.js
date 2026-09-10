const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security configuration (change this or set via environment variable)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tkd2026"; 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store for tournament announcements
let notifications = [
  {
    id: "1",
    title: "Welcome Competitors & Spectators!",
    body: "Please check your ring assignments at the main board. Matches start at 9:00 AM.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isEdited: false
  }
];

// --- Authentication Middleware ---
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: "Unauthorized. Admin access required." });
  }
  next();
}

// --- Routes ---

// Admin Authentication Check
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, error: "Incorrect admin password" });
  }
});

// GET /api/notifications - Viewers poll this endpoint
app.get('/api/notifications', (req, res) => {
  // Sort newest to oldest
  const sorted = [...notifications].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(sorted);
});

// POST /api/notifications - Create notification (Admin Only)
app.post('/api/notifications', requireAdmin, (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required." });
  }

  const newNotif = {
    id: Date.now().toString(),
    title: title.trim(),
    body: body.trim(),
    updatedAt: new Date().toISOString(),
    isEdited: false
  };

  notifications.push(newNotif);
  res.status(201).json(newNotif);
});

// PUT /api/notifications/:id - Edit notification (Admin Only)
app.put('/api/notifications/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;

  const notif = notifications.find(n => n.id === id);
  if (!notif) {
    return res.status(404).json({ error: "Notification not found." });
  }

  if (title) notif.title = title.trim();
  if (body) notif.body = body.trim();
  notif.updatedAt = new Date().toISOString();
  notif.isEdited = true;

  res.json(notif);
});

app.listen(PORT, () => {
  console.log(`TKD Board running on port ${PORT}`);
});