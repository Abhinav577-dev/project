const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const router = express.Router();

// Middleware to check admin authentication
const requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.type === 'admin') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Dashboard stats
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const adminId = req.session.user.id;

    const customersCount = await db.query(
      'SELECT COUNT(*) FROM customer WHERE admin_id = $1',
      [adminId]
    );

    const accountsCount = await db.query(
      `SELECT COUNT(*) FROM account a
       JOIN customer c ON a.customer_id = c.customer_id
       WHERE c.admin_id = $1`,
      [adminId]
    );

    const pendingBills = await db.query(
      `SELECT COUNT(*) FROM invoice i
       JOIN billing b ON i.billing_id = b.billing_id
       JOIN account a ON b.account_id = a.account_id
       JOIN customer c ON a.customer_id = c.customer_id
       WHERE c.admin_id = $1 AND i.status = 'Unpaid'`,
      [adminId]
    );

    res.json({
      customers: parseInt(customersCount.rows[0].count),
      accounts: parseInt(accountsCount.rows[0].count),
      pendingBills: parseInt(pendingBills.rows[0].count)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message || 'Server error', details: error.code });
  }
});

// Get all customers
router.get('/customers', requireAdmin, async (req, res) => {
  try {
    const adminId = req.session.user.id;
    const result = await db.query(
      'SELECT * FROM customer WHERE admin_id = $1 ORDER BY created_at DESC',
      [adminId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Add customer
router.post('/customers', requireAdmin, async (req, res) => {
  try {
    const { username, password, fullName, email, phone, address } = req.body;
    const adminId = req.session.user.id;

    const existingUser = await db.query(
      'SELECT * FROM customer WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO customer (admin_id, username, password, full_name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [adminId, username, hashedPassword, fullName, email, phone, address]
    );

    res.json({ message: 'Customer added successfully', customer: result.rows[0] });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Update customer
router.put('/customers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, address } = req.body;
    const adminId = req.session.user.id;

    const result = await db.query(
      `UPDATE customer SET full_name = $1, email = $2, phone = $3, address = $4
       WHERE customer_id = $5 AND admin_id = $6 RETURNING *`,
      [fullName, email, phone, address, id, adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully', customer: result.rows[0] });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete customer
router.delete('/customers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.session.user.id;

    const result = await db.query(
      'DELETE FROM customer WHERE customer_id = $1 AND admin_id = $2 RETURNING *',
      [id, adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all accounts
router.get('/accounts', requireAdmin, async (req, res) => {
  try {
    const adminId = req.session.user.id;
    const result = await db.query(
      `SELECT a.*, c.full_name as customer_name, c.username as customer_username,
              t.tariff_type, t.rate_per_unit
       FROM account a
       JOIN customer c ON a.customer_id = c.customer_id
       LEFT JOIN tariff t ON a.tariff_id = t.tariff_id
       WHERE c.admin_id = $1 ORDER BY a.created_at DESC`,
      [adminId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add account
router.post('/accounts', requireAdmin, async (req, res) => {
  try {
    const { customerId, meterNumber, tariffId, connectionDate } = req.body;
    const adminId = req.session.user.id;

    // Verify customer belongs to admin
    const customerCheck = await db.query(
      'SELECT * FROM customer WHERE customer_id = $1 AND admin_id = $2',
      [customerId, adminId]
    );

    if (customerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const result = await db.query(
      `INSERT INTO account (customer_id, meter_number, tariff_id, connection_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customerId, meterNumber, tariffId, connectionDate]
    );

    res.json({ message: 'Account added successfully', account: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Meter number already exists' });
    }
    console.error('Add account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update account
router.put('/accounts/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tariffId, status } = req.body;
    const adminId = req.session.user.id;

    const result = await db.query(
      `UPDATE account SET tariff_id = $1, status = $2
       WHERE account_id = $3 
       AND customer_id IN (SELECT customer_id FROM customer WHERE admin_id = $4)
       RETURNING *`,
      [tariffId, status, id, adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account updated successfully', account: result.rows[0] });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
router.delete('/accounts/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.session.user.id;

    const result = await db.query(
      `DELETE FROM account WHERE account_id = $1 
       AND customer_id IN (SELECT customer_id FROM customer WHERE admin_id = $2)
       RETURNING *`,
      [id, adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add meter reading and generate bill
router.post('/billing', requireAdmin, async (req, res) => {
  try {
    const { accountId, readingDate, unitsConsumed, billingMonth, billingYear } = req.body;
    const adminId = req.session.user.id;

    // Verify account belongs to admin
    const accountCheck = await db.query(
      `SELECT a.*, t.rate_per_unit, t.tariff_id
       FROM account a
       JOIN customer c ON a.customer_id = c.customer_id
       LEFT JOIN tariff t ON a.tariff_id = t.tariff_id
       WHERE a.account_id = $1 AND c.admin_id = $2`,
      [accountId, adminId]
    );

    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountCheck.rows[0];
    const tariffRate = account.rate_per_unit || 0;
    const tariffId = account.tariff_id;
    const amount = parseFloat(unitsConsumed) * parseFloat(tariffRate);

    // Create billing record
    const billingResult = await db.query(
      `INSERT INTO billing (account_id, reading_date, units_consumed, tariff_id, amount, billing_month, billing_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [accountId, readingDate, unitsConsumed, tariffId, amount, billingMonth, billingYear]
    );

    const billing = billingResult.rows[0];

    // Generate invoice
    const invoiceNumber = `INV-${billingYear}-${billingMonth}-${billing.billing_id}`;
    const dueDate = new Date(readingDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from reading date

    const invoiceResult = await db.query(
      `INSERT INTO invoice (billing_id, invoice_number, invoice_date, due_date, amount_due, status)
       VALUES ($1, $2, $3, $4, $5, 'Unpaid') RETURNING *`,
      [billing.billing_id, invoiceNumber, readingDate, dueDate, amount]
    );

    res.json({
      message: 'Bill generated successfully',
      billing: billing,
      invoice: invoiceResult.rows[0]
    });
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Get all bills
router.get('/bills', requireAdmin, async (req, res) => {
  try {
    const adminId = req.session.user.id;
    const result = await db.query(
      `SELECT b.*, a.meter_number, c.full_name as customer_name,
              t.tariff_type, i.invoice_number, i.status as invoice_status
       FROM billing b
       JOIN account a ON b.account_id = a.account_id
       JOIN customer c ON a.customer_id = c.customer_id
       LEFT JOIN tariff t ON b.tariff_id = t.tariff_id
       LEFT JOIN invoice i ON b.billing_id = i.billing_id
       WHERE c.admin_id = $1 ORDER BY b.created_at DESC`,
      [adminId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all invoices
router.get('/invoices', requireAdmin, async (req, res) => {
  try {
    const adminId = req.session.user.id;
    const result = await db.query(
      `SELECT i.*, b.units_consumed, b.reading_date, a.meter_number,
              c.full_name as customer_name, c.email, c.phone, c.address,
              t.tariff_type
       FROM invoice i
       JOIN billing b ON i.billing_id = b.billing_id
       JOIN account a ON b.account_id = a.account_id
       JOIN customer c ON a.customer_id = c.customer_id
       LEFT JOIN tariff t ON b.tariff_id = t.tariff_id
       WHERE c.admin_id = $1 ORDER BY i.created_at DESC`,
      [adminId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tariffs
router.get('/tariffs', requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tariff ORDER BY tariff_type');
    res.json(result.rows);
  } catch (error) {
    console.error('Get tariffs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add tariff
router.post('/tariffs', requireAdmin, async (req, res) => {
  try {
    const { tariffType, ratePerUnit, description } = req.body;

    const result = await db.query(
      `INSERT INTO tariff (tariff_type, rate_per_unit, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [tariffType, ratePerUnit, description]
    );

    res.json({ message: 'Tariff added successfully', tariff: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Tariff type already exists' });
    }
    console.error('Add tariff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update tariff
router.put('/tariffs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { ratePerUnit, description } = req.body;

    const result = await db.query(
      `UPDATE tariff SET rate_per_unit = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE tariff_id = $3 RETURNING *`,
      [ratePerUnit, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tariff not found' });
    }

    res.json({ message: 'Tariff updated successfully', tariff: result.rows[0] });
  } catch (error) {
    console.error('Update tariff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete tariff
router.delete('/tariffs/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tariff is in use
    const inUse = await db.query(
      'SELECT COUNT(*) FROM account WHERE tariff_id = $1',
      [id]
    );

    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Tariff is in use and cannot be deleted' });
    }

    const result = await db.query(
      'DELETE FROM tariff WHERE tariff_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tariff not found' });
    }

    res.json({ message: 'Tariff deleted successfully' });
  } catch (error) {
    console.error('Delete tariff error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

