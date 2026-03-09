const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Determine SSL CA source
let caCert;
if (process.env.DB_CA_CONTENT) {
  // Use the text pasted into Render's dashboard
  caCert = process.env.DB_CA_CONTENT;
} else {
  // Use the local file path
  const certPath = path.join(__dirname, '..', '..', 'database', 'ca.pem');
  caCert = fs.readFileSync(certPath);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 16256,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: {
    ca: caCert,
    rejectUnauthorized: true
  }
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected safely to Aiven via SSL');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    // On Render, this error often means the IP isn't allowed or the SSL cert is missing
    process.exit(1);
  }
};

testConnection();

module.exports = pool;
