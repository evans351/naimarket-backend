const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// 📁 Setup Multer storage
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_').replace(/[()]/g, '');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/**
 * GET /api/vendors
 */
router.get('/', (req, res) => {
  const query = 'SELECT id, name, description, image, category FROM vendors';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

/**
 * GET /api/vendors/:id
 */
router.get('/:id', (req, res) => {
  const vendorId = req.params.id;
  const query = 'SELECT * FROM vendors WHERE id = ?';
  db.query(query, [vendorId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(results[0]);
  });
});

/**
 * POST /api/vendors/update-logo
 */
router.post('/update-logo', upload.single('image'), (req, res) => {
  const vendorId = req.body.vendorId;
  const image = req.file?.filename;

  if (!vendorId || !image) {
    return res.status(400).json({ message: 'Missing vendorId or image file' });
  }

  const sql = 'UPDATE vendors SET image = ? WHERE id = ?';
  db.query(sql, [image, vendorId], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to update logo' });
    res.json({ message: '✅ Vendor logo updated successfully', image });
  });
});

/**
 * POST /api/logout
 */
router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Vendor logged out successfully' });
});

module.exports = router;


