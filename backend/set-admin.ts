require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }

  console.log(`Found ${users.length} users.`);
  
  // Reset everyone to CUSTOMER
  await prisma.user.updateMany({
    data: { role: 'CUSTOMER' }
  });

  // Set the most recently registered user as ADMIN
  const latestUser = users[0];
  await prisma.user.update({
    where: { id: latestUser.id },
    data: { role: 'ADMIN' }
  });

  console.log(`Successfully updated user ${latestUser.email} (Name: ${latestUser.firstName} ${latestUser.lastName}) to ADMIN!`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
