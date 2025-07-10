require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static image files from /uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ✅ Route Imports
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services'); // contains /api/secure-file
const vendorRoutes = require('./routes/vendor');
const categoryRoutes = require('./routes/categories');
const orderRoutes = require('./routes/orders');

// ✅ Mount Routes
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);  // e.g., /api/services/...
app.use('/api/vendors', vendorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);

// ✅ Secure file route (from services.js)
app.use('/api', serviceRoutes);  // so /api/secure-file works

// ✅ Health Check
app.get('/', (req, res) => {
  res.send('NaiMarket API is running!');
});

// ✅ Login with vendorId if vendor
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log('🔐 Login attempt with email:', email);

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('❌ DB Error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials (email not found)' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (password mismatch)' });
    }

    if (user.role === 'vendor') {
      const vendorSql = 'SELECT id FROM vendors WHERE user_id = ? LIMIT 1';
      db.query(vendorSql, [user.id], (vendorErr, vendorResults) => {
        if (vendorErr) {
          console.error('❌ Vendor lookup error:', vendorErr);
          return res.status(500).json({ message: 'Login error (vendor lookup)' });
        }

        const vendorId = vendorResults[0]?.id || null;

        return res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            vendorId
          }
        });
      });

    } else if (user.role === 'customer') {
      const customerSql = 'SELECT id FROM customers WHERE user_id = ? LIMIT 1';
      db.query(customerSql, [user.id], (custErr, custResults) => {
        if (custErr) {
          console.error('❌ Customer lookup error:', custErr);
          return res.status(500).json({ message: 'Login error (customer lookup)' });
        }

        const customerId = custResults[0]?.id || null;

        return res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            customerId
          }
        });
      });

    } else {
      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
  });
});

// ✅ Register with role-based profile creation
app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const userSql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(userSql, [name, email, hashedPassword, role], (err, result) => {
      if (err) {
        console.error('❌ Registration error:', err);
        return res.status(500).json({ message: 'Error registering user' });
      }

      const userId = result.insertId;

      const respond = () => {
        res.status(201).json({
          message: `${role} registered successfully`,
          user: {
            id: userId,
            name,
            email,
            role
          }
        });
      };

      if (role === 'vendor') {
        const vendorSql = 'INSERT INTO vendors (user_id, name) VALUES (?, ?)';
        db.query(vendorSql, [userId, name], (vendorErr) => {
          if (vendorErr) {
            console.error('❌ Vendor insert error:', vendorErr);
            return res.status(500).json({ message: 'User added, but failed to create vendor profile' });
          }
          respond();
        });

      } else if (role === 'customer') {
        const customerSql = 'INSERT INTO customers (user_id, name) VALUES (?, ?)';
        db.query(customerSql, [userId, name], (custErr) => {
          if (custErr) {
            console.error('❌ Customer insert error:', custErr);
            return res.status(500).json({ message: 'User added, but failed to create customer profile' });
          }
          respond();
        });

      } else {
        respond(); // Admin role
      }
    });

  } catch (err) {
    console.error('❌ Hashing/server error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Dummy logout
app.post('/api/logout', (req, res) => {
  res.json({ message: 'User logged out successfully' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});


