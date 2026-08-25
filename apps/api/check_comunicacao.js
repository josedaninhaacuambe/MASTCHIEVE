const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.pedidoComunicacao.findMany({ take: 3, orderBy: { createdAt: 'desc' }, select: { id: true, titulo: true, estado: true, canal: true, publicoAlvo: true } })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
  .finally(() => p.$disconnect());
