const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware to check customer authentication
const requireCustomer = (req, res, next) => {
  if (req.session.user && req.session.user.type === 'customer') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Get customer profile
router.get('/profile', requireCustomer, async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const result = await db.query(
      'SELECT customer_id, username, full_name, email, phone, address, created_at FROM customer WHERE customer_id = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer accounts
router.get('/accounts', requireCustomer, async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const result = await db.query(
      `SELECT a.*, t.tariff_type, t.rate_per_unit
       FROM account a
       LEFT JOIN tariff t ON a.tariff_id = t.tariff_id
       WHERE a.customer_id = $1 ORDER BY a.created_at DESC`,
      [customerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer bills
router.get('/bills', requireCustomer, async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const result = await db.query(
      `SELECT b.*, a.meter_number, t.tariff_type, i.invoice_number, i.status as invoice_status
       FROM billing b
       JOIN account a ON b.account_id = a.account_id
       LEFT JOIN tariff t ON b.tariff_id = t.tariff_id
       LEFT JOIN invoice i ON b.billing_id = i.billing_id
       WHERE a.customer_id = $1 ORDER BY b.created_at DESC`,
      [customerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer invoices
router.get('/invoices', requireCustomer, async (req, res) => {
  try {
    const customerId = req.session.user.id;
    const result = await db.query(
      `SELECT i.*, b.units_consumed, b.reading_date, a.meter_number,
              t.tariff_type, c.full_name as customer_name, c.email, c.phone, c.address
       FROM invoice i
       JOIN billing b ON i.billing_id = b.billing_id
       JOIN account a ON b.account_id = a.account_id
       JOIN customer c ON a.customer_id = c.customer_id
       LEFT JOIN tariff t ON b.tariff_id = t.tariff_id
       WHERE a.customer_id = $1 ORDER BY i.created_at DESC`,
      [customerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single invoice by ID
router.get('/invoices/:id', requireCustomer, async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.session.user.id;

    const result = await db.query(
      `SELECT i.*, b.units_consumed, b.reading_date, a.meter_number,
              t.tariff_type, c.full_name as customer_name, c.email, c.phone, c.address
       FROM invoice i
       JOIN billing b ON i.billing_id = b.billing_id
       JOIN account a ON b.account_id = a.account_id
       JOIN customer c ON a.customer_id = c.customer_id
       LEFT JOIN tariff t ON b.tariff_id = t.tariff_id
       WHERE i.invoice_id = $1 AND a.customer_id = $2`,
      [id, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark invoice as paid/unpaid
router.put('/invoices/:id/status', requireCustomer, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const customerId = req.session.user.id;

    if (!['Paid', 'Unpaid'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const paidDate = status === 'Paid' ? new Date() : null;

    const result = await db.query(
      `UPDATE invoice SET status = $1, paid_date = $2
       WHERE invoice_id = $3 
       AND billing_id IN (
         SELECT b.billing_id FROM billing b
         JOIN account a ON b.account_id = a.account_id
         WHERE a.customer_id = $4
       ) RETURNING *`,
      [status, paidDate, id, customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ message: 'Invoice status updated', invoice: result.rows[0] });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

