const express = require('express');
const db = require('../db');
const router = express.Router();

// Get board summary
router.get('/summary', async (req, res) => {
  try {
    // Get board info
    const boardResult = await db.query('SELECT * FROM elec_board LIMIT 1');
    const board = boardResult.rows[0] || {};

    // Get admins count
    const adminsCount = await db.query('SELECT COUNT(*) FROM admin');
    
    // Get customers count
    const customersCount = await db.query('SELECT COUNT(*) FROM customer');
    
    // Get total revenue (sum of all paid invoices)
    const revenueResult = await db.query(
      "SELECT COALESCE(SUM(amount_due), 0) as total_revenue FROM invoice WHERE status = 'Paid'"
    );

    // Get pending revenue
    const pendingRevenueResult = await db.query(
      "SELECT COALESCE(SUM(amount_due), 0) as pending_revenue FROM invoice WHERE status = 'Unpaid'"
    );

    res.json({
      board: board,
      admins: parseInt(adminsCount.rows[0].count),
      customers: parseInt(customersCount.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
      pendingRevenue: parseFloat(pendingRevenueResult.rows[0].pending_revenue)
    });
  } catch (error) {
    console.error('Board summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all admins
router.get('/admins', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.admin_id, a.username, a.full_name, a.email, a.created_at, b.board_name
       FROM admin a
       LEFT JOIN elec_board b ON a.board_id = b.board_id
       ORDER BY a.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all customers
router.get('/customers', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, a.full_name as admin_name
       FROM customer c
       LEFT JOIN admin a ON c.admin_id = a.admin_id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

