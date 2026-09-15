const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const email = 'ubedkhatri2608@gmail.com';
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = res.rows[0];
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET || 'secret',
    { expiresIn: '1h' }
  );
  
  console.log('Generated token for', user.email);
  
  try {
    const response = await axios.post('http://localhost:5000/api/v1/products', {
      name: 'Test Product',
      categoryId: 'some-id',
      basePrice: 100
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', response.status, response.data);
  } catch (err) {
    console.log('Error:', err.response ? err.response.data : err.message);
  }
}

main().finally(() => pool.end());
