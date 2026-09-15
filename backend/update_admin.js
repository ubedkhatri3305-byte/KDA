const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['ADMIN', 'admin@admin.com']);
  console.log('Updated admin@admin.com to ADMIN');
}

main().finally(() => pool.end());
