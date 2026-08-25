const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.mensagemWhatsapp.findFirst({ where: { tipo: 'COMUNICACAO', studentId: '0285b02d-1dec-4694-a4b4-c9f171d21933' }, select: { telefone: true, studentId: true } })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
  .finally(() => p.$disconnect());
