const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const msg = await prisma.mensagemWhatsapp.create({
    data: {
      tipo: 'OUTRO',
      telefone: '+351999999999',
      mensagem: 'Mensagem de teste enviada pelo script',
      estado: 'PENDENTE',
    },
  });
  console.log('Created message id:', msg.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
