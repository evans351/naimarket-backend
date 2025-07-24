require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static files (e.g., user uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Route imports
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const vendorRoutes = require('./routes/vendor');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');

// ✅ Mount API Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);        // includes /api/services/secure-file
app.use('/api/vendors', vendorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pay', paymentsRoutes);            // now clearly /api/pay/paystack etc

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('🛍️ NaiMarket API is running!');
});

// ✅ LOGIN route with role check
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log('🔐 Login attempt from:', email);

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

      const lookupRoleProfile = (roleTable, key) => {
        const sql = `SELECT id FROM ${roleTable} WHERE user_id = ? LIMIT 1`;
        db.query(sql, [user.id], (err, results) => {
          if (err) return res.status(500).json({ message: `Error fetching ${roleTable} profile` });

          const profileId = results[0]?.id || null;
          return res.json({
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email, role: user.role, [key]: profileId }
          });
        });
      };

      if (user.role === 'vendor') {
        lookupRoleProfile('vendors', 'vendorId');
      } else if (user.role === 'customer') {
        lookupRoleProfile('customers', 'customerId');
      } else {
        return res.json({
          message: 'Login successful',
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
      }

    } catch (error) {
      return res.status(500).json({ message: 'Login server error' });
    }
  });
});

// ✅ REGISTER route with profile creation
app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userSql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';

    db.query(userSql, [name, email, hashedPassword, role], (err, result) => {
      if (err) return res.status(500).json({ message: 'User creation failed' });

      const userId = result.insertId;

      const respond = () => res.status(201).json({
        message: `${role} registered successfully`,
        user: { id: userId, name, email, role }
      });

      if (role === 'vendor') {
        db.query('INSERT INTO vendors (user_id, name) VALUES (?, ?)', [userId, name], (e) => {
          if (e) return res.status(500).json({ message: 'Vendor profile creation failed' });
          respond();
        });
      } else if (role === 'customer') {
        db.query('INSERT INTO customers (user_id, name) VALUES (?, ?)', [userId, name], (e) => {
          if (e) return res.status(500).json({ message: 'Customer profile creation failed' });
          respond();
        });
      } else {
        respond();
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration server error' });
  }
});

// ✅ Dummy logout
app.post('/api/logout', (req, res) => {
  res.json({ message: 'User logged out successfully' });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 NaiMarket API is running on http://localhost:${PORT}`);
});


