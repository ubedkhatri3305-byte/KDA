/**
 * Fix existing products where totalStock = 0 but variants have stock.
 * Run once: node fix-stock.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function fixStock() {
  console.log('Connecting to database...');

  const products = await prisma.product.findMany({
    where: { totalStock: 0 },
    include: { variants: { where: { isActive: true } } },
  });

  console.log(`Found ${products.length} products with zero stock.`);

  let fixed = 0;
  for (const product of products) {
    const variantStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const newStock = variantStock > 0 ? variantStock : 999;

    await prisma.product.update({
      where: { id: product.id },
      data: { totalStock: newStock },
    });

    console.log(`Fixed: "${product.name}" -> totalStock = ${newStock}`);
    fixed++;
  }

  console.log(`Done! Fixed ${fixed} products.`);
  await prisma.$disconnect();
  await pool.end();
}

fixStock().catch(async (err) => {
  console.error('Error:', err.message);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
