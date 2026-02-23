const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const port = 3000;
const db = new Database('campus_lost_found.db');

// Database Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    profile_pic TEXT
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    category TEXT,
    location TEXT,
    date TEXT,
    status TEXT, -- 'lost' or 'found'
    image_url TEXT,
    reporter_id TEXT,
    contact_info TEXT,
    is_resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(reporter_id) REFERENCES users(id)
  );
`);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- Auth Endpoints ---
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  const id = uuidv4();
  try {
    const stmt = db.prepare('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)');
    stmt.run(id, username, email, password);
    res.json({ success: true, user: { id, username, email } });
  } catch (err) {
    res.status(400).json({ success: false, error: 'User already exists or invalid data' });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
  if (user) {
    res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// --- Items Endpoints ---
app.get('/api/items', (req, res) => {
  const { status, category, search } = req.query;
  let query = 'SELECT items.*, users.username as reporter_name FROM items JOIN users ON items.reporter_id = users.id WHERE is_resolved = 0';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const items = db.prepare(query).all(...params);
  res.json(items);
});

app.post('/api/items', upload.single('image'), (req, res) => {
  const { title, description, category, location, date, status, reporter_id, contact_info } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const id = uuidv4();

  try {
    const stmt = db.prepare(`
      INSERT INTO items (id, title, description, category, location, date, status, image_url, reporter_id, contact_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, description, category, location, date, status, image_url, reporter_id, contact_info);
    res.json({ success: true, item_id: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to report item' });
  }
});

app.patch('/api/items/:id/resolve', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE items SET is_resolved = 1 WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
