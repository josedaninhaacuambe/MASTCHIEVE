const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.mensagemWhatsapp.findMany({ where: { tipo: 'COMUNICACAO' }, select: { telefone: true, studentId: true } })
  .then(r => { console.log('total:', r.length); console.log(JSON.stringify(r.slice(0,5), null, 2)); })
  .catch(console.error)
  .finally(() => p.$disconnect());
