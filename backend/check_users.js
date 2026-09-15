const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const res = await pool.query('SELECT id, email, role FROM users');
  console.log('All users:');
  console.table(res.rows);
}

main().finally(() => pool.end());
