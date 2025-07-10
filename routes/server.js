// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Import and use routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Get total number of services
router.get('/count', (req, res) => {
  db.query('SELECT COUNT(*) AS totalServices FROM services', (err, results) => {
    if (err) {
      console.error('Error fetching service count:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0]);
  });
});
