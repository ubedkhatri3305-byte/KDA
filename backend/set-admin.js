require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL missing from .env");
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  
  try {
    const { rows } = await client.query('SELECT id, email, role, "createdAt" FROM "users" ORDER BY "createdAt" DESC');
    
    if (rows.length === 0) {
      console.log("No users found in database.");
      return;
    }

    console.log(`Found ${rows.length} users.`);

    // Set everyone to CUSTOMER
    await client.query('UPDATE "users" SET role = $1', ['CUSTOMER']);
    
    // Set latest user to ADMIN
    const latestUser = rows[0];
    await client.query('UPDATE "users" SET role = $1 WHERE id = $2', ['ADMIN', latestUser.id]);

    console.log(`Successfully updated latest user (${latestUser.email}) to ADMIN!`);
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
