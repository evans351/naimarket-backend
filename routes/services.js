const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 📁 Multer: Setup safe filename
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const cleanName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_').replace(/[()]/g, '');
    cb(null, cleanName);
  }
});

// ✅ Multer config with limits
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, or WebP allowed'), false);
    }
    cb(null, true);
  }
});

/**
 * GET /api/services/count
 */
router.get('/count', (req, res) => {
  db.query('SELECT COUNT(*) AS totalServices FROM services', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results[0]);
  });
});

/**
 * GET /api/services
 */
router.get('/', (req, res) => {
  const vendorId = req.query.vendor_id;
  let sql = 'SELECT * FROM services';
  let params = [];

  if (vendorId) {
    sql += ' WHERE vendor_id = ?';
    params.push(vendorId);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching services' });
    res.json(results);
  });
});

/**
 * POST /api/services
 */
router.post('/', upload.single('image'), (req, res) => {
  const { vendor_id, title, description, price, unit, category } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!vendor_id || !title || !price || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO services (vendor_id, title, description, price, unit, image, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [vendor_id, title, description, price, unit, image, category], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to add service' });
    res.status(201).json({ message: '✅ Service added successfully' });
  });
});

/**
 * DELETE /api/services/:id
 */
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM services WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Failed to delete service' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: '✅ Service deleted successfully' });
  });
});

/**
 * ✅ SECURE FILE DOWNLOAD: GET /api/secure-file?file=filename.jpg&token=naimarket_secure_token
 */
router.get('/secure-file', (req, res) => {
  const { file, token } = req.query;

  // 🔐 Simulated token auth
  if (token !== 'naimarket_secure_token') {
    return res.status(403).json({ message: 'Unauthorized access' });
  }

  const filePath = path.join(__dirname, '../uploads', file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  res.sendFile(filePath);
});

module.exports = router;




