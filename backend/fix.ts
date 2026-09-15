import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'ubedkhatri2608@gmail.com';
  let user = await prisma.user.findUnique({
    where: { email },
  });

  console.log('User found:', user ? user.role : 'NOT FOUND');
  
  if (user && user.role !== 'ADMIN') {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    console.log('Updated to ADMIN');
  }
}

main().finally(() => prisma.$disconnect());
