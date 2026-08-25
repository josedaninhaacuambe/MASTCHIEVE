const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.lead.findMany({ select: { id: true, origem: true, telefone: true }, take: 10 })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
  .finally(() => p.$disconnect());
