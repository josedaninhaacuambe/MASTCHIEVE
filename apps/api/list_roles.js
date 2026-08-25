const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.groupBy({ by: ['role'], _count: true })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
