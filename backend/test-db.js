require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const p = await prisma.product.findMany({ include: { images: true } });
  console.log(`Found ${p.length} products:`);
  console.log(JSON.stringify(p.map(x => ({ id: x.id, name: x.name, imagesCount: x.images.length })), null, 2));
}
main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

