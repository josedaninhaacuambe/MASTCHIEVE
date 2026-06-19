const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ where: { role: 'STUDENT' }, select: { email: true }, take: 5 })
  .then(r => { r.forEach(u => console.log(u.email)); })
  .catch(console.error)
  .finally(() => p.$disconnect());
