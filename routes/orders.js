const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/orders - Place a new order
router.post('/', (req, res) => {
  const { customer_id, vendor_id, service_id, quantity } = req.body;

  if (!customer_id || !vendor_id || !service_id || !quantity) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `INSERT INTO orders (customer_id, vendor_id, service_id, quantity) VALUES (?, ?, ?, ?)`;

  db.query(sql, [customer_id, vendor_id, service_id, quantity], (err, result) => {
    if (err) {
      console.error('❌ Order insert error:', err);
      return res.status(500).json({ message: 'Failed to place order' });
    }
    res.status(201).json({ message: 'Order placed successfully', orderId: result.insertId });
  });
});

// ✅ GET /api/orders?customer_id=...
router.get('/', (req, res) => {
  const customerId = req.query.customer_id;

  if (!customerId) {
    return res.status(400).json({ message: 'Missing customer_id' });
  }

  const sql = `
    SELECT 
      orders.*, 
      services.title AS service_title, 
      services.image AS service_image,     -- ✅ Include image
      vendors.name AS vendor_name
    FROM orders
    JOIN services ON orders.service_id = services.id
    JOIN vendors ON orders.vendor_id = vendors.id
    WHERE orders.customer_id = ?
    ORDER BY orders.created_at DESC
  `;

  db.query(sql, [customerId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching orders:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// ✅ GET /api/vendor-orders?vendor_id=...
router.get('/vendor-orders', (req, res) => {
  const vendorId = req.query.vendor_id;

  if (!vendorId) {
    return res.status(400).json({ message: 'Missing vendor_id' });
  }

  const sql = `
    SELECT 
      o.*, 
      s.title AS service_title, 
      u.name AS customer_name
    FROM orders o
    JOIN services s ON o.service_id = s.id
    JOIN users u ON o.customer_id = u.id
    WHERE o.vendor_id = ?
    ORDER BY o.created_at DESC
  `;

  db.query(sql, [vendorId], (err, results) => {
    if (err) {
      console.error('❌ Vendor order fetch error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// PATCH /api/orders/:id - Update status
router.patch('/:id', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const sql = 'UPDATE orders SET status = ? WHERE id = ?';

  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      console.error('❌ Error updating order status:', err);
      return res.status(500).json({ message: 'Failed to update order status' });
    }

    res.json({ message: 'Order status updated successfully' });
  });
});


module.exports = router;

