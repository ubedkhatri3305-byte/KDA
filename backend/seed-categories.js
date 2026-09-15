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
    const categories = [
      { name: 'Men', slug: 'men', description: 'Men clothing and accessories' },
      { name: 'Women', slug: 'women', description: 'Women clothing and accessories' },
      { name: 'Kids', slug: 'kids', description: 'Kids clothing and accessories' },
      { name: 'Shoes', slug: 'shoes', description: 'Footwear for all' },
      { name: 'Accessories', slug: 'accessories', description: 'Bags, belts, and more' }
    ];

    for (const cat of categories) {
      // Check if exists
      const { rows } = await client.query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
      if (rows.length === 0) {
        // Insert
        // Generate a random UUID
        const crypto = require('crypto');
        const id = crypto.randomUUID();
        await client.query(
          'INSERT INTO categories (id, name, slug, description, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
          [id, cat.name, cat.slug, cat.description]
        );
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }
    console.log("Categories seeded successfully!");
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
