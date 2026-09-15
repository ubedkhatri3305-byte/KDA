require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL missing from .env");
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  
  try {
    // Clear all existing categories to start fresh
    await client.query('DELETE FROM categories');
    console.log('Cleared existing categories.');

    const structure = {
      "Women": ['Saree', 'Kurti', 'Dress Materials', 'Pant', 'Dupatta', 'Stole', 'Kurti Set', 'Co Ord Set'],
      "Men": ['Kurta', 'Pajama Shirt'],
      "Kids": ['Girls - Chanya Choli', 'Girls - Frock', 'Girls - Kurti', 'Girls - Kurti Set', 'Boys - Kurta', 'Boys - Kurta Set'],
      "Others": ['Bedsheet', 'Shawl', 'Materials']
    };

    for (const [parentName, children] of Object.entries(structure)) {
      const parentId = crypto.randomUUID();
      const parentSlug = parentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      await client.query(
        'INSERT INTO categories (id, name, slug, description, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [parentId, parentName, parentSlug, `${parentName} category`]
      );
      console.log(`Created parent category: ${parentName}`);

      for (const childName of children) {
        const childId = crypto.randomUUID();
        const childSlug = childName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        await client.query(
          'INSERT INTO categories (id, name, slug, description, "parentId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [childId, childName, childSlug, `${childName} category`, parentId]
        );
        console.log(`  -> Created child category: ${childName}`);
      }
    }

    console.log("Categories seeded successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

main().catch(console.error);
