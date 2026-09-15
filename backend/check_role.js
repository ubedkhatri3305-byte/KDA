require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'ubedkhatri2608@gmail.com';
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`User with email ${email} not found.`);
  } else {
    console.log(`Current Role: ${user.role}`);
    
    if (user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      });
      console.log(`Updated Role to: ${user.role}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

