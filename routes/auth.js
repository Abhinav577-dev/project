const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await db.query(
      'SELECT * FROM admin WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      id: admin.admin_id,
      username: admin.username,
      type: 'admin',
      boardId: admin.board_id
    };

    res.json({ 
      message: 'Login successful', 
      user: {
        id: admin.admin_id,
        username: admin.username,
        fullName: admin.full_name,
        type: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    if (error.code === '42P01') {
      return res.status(500).json({ error: 'Database tables not found. Please run: npm run init-db' });
    }
    if (error.code === '28P01' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: 'Database connection failed. Please check PostgreSQL is running and credentials are correct.' });
    }
    res.status(500).json({ error: error.message || 'Server error. Please check database connection.' });
  }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await db.query(
      'SELECT * FROM customer WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const customer = result.rows[0];
    const validPassword = await bcrypt.compare(password, customer.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      id: customer.customer_id,
      username: customer.username,
      type: 'customer'
    };

    res.json({ 
      message: 'Login successful', 
      user: {
        id: customer.customer_id,
        username: customer.username,
        fullName: customer.full_name,
        type: 'customer'
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    if (error.code === '42P01') {
      return res.status(500).json({ error: 'Database tables not found. Please run: npm run init-db' });
    }
    if (error.code === '28P01' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: 'Database connection failed. Please check PostgreSQL is running and credentials are correct.' });
    }
    res.status(500).json({ error: error.message || 'Server error. Please check database connection.' });
  }
});

// Customer Register
router.post('/customer/register', async (req, res) => {
  try {
    const { username, password, fullName, email, phone, address } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    // Check if username exists
    const existingUser = await db.query(
      'SELECT * FROM customer WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get first admin for default assignment (in real app, admin would assign)
    const adminResult = await db.query('SELECT admin_id FROM admin LIMIT 1');
    const adminId = adminResult.rows[0]?.admin_id;

    if (!adminId) {
      return res.status(500).json({ error: 'No admin available' });
    }

    const result = await db.query(
      `INSERT INTO customer (admin_id, username, password, full_name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING customer_id, username, full_name`,
      [adminId, username, hashedPassword, fullName, email, phone, address]
    );

    res.json({ 
      message: 'Registration successful', 
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    if (error.code === '42P01') {
      return res.status(500).json({ error: 'Database tables not found. Please run: npm run init-db' });
    }
    if (error.code === '28P01' || error.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: 'Database connection failed. Please check PostgreSQL is running and credentials are correct.' });
    }
    res.status(500).json({ error: error.message || 'Server error. Please check database connection.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check session
router.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = router;

