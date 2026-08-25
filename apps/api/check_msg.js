const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.mensagemWhatsapp.findMany({ where: { tipo: 'CAMPANHA' }, select: { id: true, tipo: true, telefone: true, leadId: true, mensagem: true, estado: true } })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
  .finally(() => p.$disconnect());
