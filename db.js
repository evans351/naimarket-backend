// db.js
const mysql = require('mysql2');

// Use connection pool instead of single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naimarket_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,         // 🔄 Keep-alive helps prevent timeouts
  connectTimeout: 10000          // 🕒 Increases connection timeout for safety
});

// Log successful connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL pool connection error:', err);
  } else {
    console.log('✅ Connected to MySQL database (pooled)');
    connection.release(); // Always release after use
  }
});

module.exports = pool;



