const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('assistente123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'assistente@mastchieve.com' },
    update: {},
    create: {
      email: 'assistente@mastchieve.com',
      password,
      role: 'ASSISTENTE_ADMIN',
      admin: {
        create: {
          firstName: 'Assistente',
          lastName: 'Admin',
          phone: '+351 910 000 002',
        },
      },
    },
  });

  console.log('Upserted ASSISTENTE_ADMIN user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
