const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const email = 'ubedkhatri2608@gmail.com';
  console.log(`Checking user: ${email}`);
  
  const res = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
  if (res.rows.length === 0) {
    console.log('User not found.');
    return;
  }
  
  const user = res.rows[0];
  console.log('Current role:', user.role);
  
  if (user.role !== 'ADMIN') {
    await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['ADMIN', email]);
    console.log('Role updated to ADMIN.');
  } else {
    console.log('Role is already ADMIN.');
  }
}

main()
  .catch(console.error)
  .finally(() => pool.end());
