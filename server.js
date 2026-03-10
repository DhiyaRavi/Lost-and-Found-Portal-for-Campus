const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'campus_lost_found',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.on('connect', () => {
  console.log(' Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error(' Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize Database Tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile_pic TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        location VARCHAR(100),
        date DATE,
        status VARCHAR(10) CHECK (status IN ('lost', 'found')),
        image_url TEXT,
        reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
        contact_info VARCHAR(100),
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
      CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
      CREATE INDEX IF NOT EXISTS idx_items_reporter ON items(reporter_id);
      CREATE INDEX IF NOT EXISTS idx_items_resolved ON items(is_resolved);
    `);

    console.log(' Database tables initialized successfully');
  } catch (error) {
    console.error(' Error initializing database:', error);
  }
}

// Initialize database on startup
initializeDatabase();

// Middleware
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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// --- Auth Endpoints ---

// Register/Signup
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register user. Please try again.' 
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, username, email, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Return user data (without password)
    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to login. Please try again.' 
    });
  }
});

// --- Items Endpoints ---

// Get all items (with optional filters)
app.get('/api/items', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    
    let query = `
      SELECT 
        items.*, 
        users.username as reporter_name 
      FROM items 
      JOIN users ON items.reporter_id = users.id 
      WHERE items.is_resolved = FALSE
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND items.status = $${paramCount}`;
      params.push(status);
    }

    if (category) {
      paramCount++;
      query += ` AND items.category = $${paramCount}`;
      params.push(category);
    }

    if (search) {
      paramCount++;
      query += ` AND (items.title ILIKE $${paramCount} OR items.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY items.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch items' 
    });
  }
});

// Create new item report
app.post('/api/items', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, location, date, status, reporter_id, contact_info } = req.body;

    // Validation
    if (!title || !description || !category || !location || !date || !status || !reporter_id || !contact_info) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    if (status !== 'lost' && status !== 'found') {
      return res.status(400).json({ 
        success: false, 
        error: 'Status must be either "lost" or "found"' 
      });
    }

    // Check if reporter exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [reporter_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Handle image upload
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Insert item
    const result = await pool.query(
      `INSERT INTO items (
        title, description, category, location, date, status, 
        image_url, reporter_id, contact_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING id`,
      [title, description, category, location, date, status, image_url, reporter_id, contact_info]
    );

    res.json({ 
      success: true, 
      item_id: result.rows[0].id,
      message: 'Item reported successfully' 
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to report item. Please try again.' 
    });
  }
});

// Mark item as resolved
app.patch('/api/items/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE items SET is_resolved = TRUE WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Item not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Item marked as resolved' 
    });
  } catch (error) {
    console.error('Error resolving item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to resolve item' 
    });
  }
});

// Get single item by ID
app.get('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        items.*, 
        users.username as reporter_name,
        users.email as reporter_email
      FROM items 
      JOIN users ON items.reporter_id = users.id 
      WHERE items.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Item not found' 
      });
    }

    res.json({ 
      success: true, 
      item: result.rows[0] 
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch item' 
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
  console.log(` Database: ${process.env.DB_NAME || 'campus_lost_found'}`);
});
