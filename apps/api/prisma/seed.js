'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Mastchieve — Seed básico de utilizadores\n');

  const hash = (pw) => bcrypt.hash(pw, 10);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@mastchieve.com' },
    update: {},
    create: {
      email: 'admin@mastchieve.com',
      password: await hash('admin123456'),
      role: 'ADMIN',
      admin: {
        create: { firstName: 'Ricardo', lastName: 'Mendonça', phone: '+258 84 000 0001' },
      },
    },
  });
  console.log('✅ Admin criado: admin@mastchieve.com / admin123456');

  // Instrutor João
  await prisma.user.upsert({
    where: { email: 'joao.silva@mastchieve.com' },
    update: {},
    create: {
      email: 'joao.silva@mastchieve.com',
      password: await hash('instructor123'),
      role: 'INSTRUCTOR',
      instructor: {
        create: {
          firstName: 'João', lastName: 'Silva',
          phone: '+258 84 111 1111',
          specializations: JSON.stringify(['Natação Técnica', 'Iniciantes']),
          bio: 'Instrutor certificado com 12 anos de experiência.',
        },
      },
    },
  });
  console.log('✅ Instrutor criado: joao.silva@mastchieve.com / instructor123');

  // Instrutora Maria
  await prisma.user.upsert({
    where: { email: 'maria.santos@mastchieve.com' },
    update: {},
    create: {
      email: 'maria.santos@mastchieve.com',
      password: await hash('instructor123'),
      role: 'INSTRUCTOR',
      instructor: {
        create: {
          firstName: 'Maria', lastName: 'Santos',
          phone: '+258 84 222 2222',
          specializations: JSON.stringify(['Natação Competitiva', 'Técnica Avançada']),
          bio: 'Ex-nadadora de alta competição, treinadora certificada.',
        },
      },
    },
  });
  console.log('✅ Instrutora criada: maria.santos@mastchieve.com / instructor123');

  // Atleta Sofia
  await prisma.user.upsert({
    where: { email: 'sofia.ferreira@atleta.mastchieve.com' },
    update: {},
    create: {
      email: 'sofia.ferreira@atleta.mastchieve.com',
      password: await hash('student123'),
      role: 'STUDENT',
      student: {
        create: {
          firstName: 'Sofia', lastName: 'Ferreira',
          dateOfBirth: new Date('2016-03-14'),
          gender: 'FEMALE',
          emergencyContact: 'Helena Ferreira',
          emergencyPhone: '+258 84 333 3333',
          enrollmentDate: new Date(),
        },
      },
    },
  });
  console.log('✅ Atleta criada: sofia.ferreira@atleta.mastchieve.com / student123');

  console.log('\n══════════════════════════════════════');
  console.log('  ✅ SEED CONCLUÍDO');
  console.log('  Admin:     admin@mastchieve.com / admin123456');
  console.log('  Instrutor: joao.silva@mastchieve.com / instructor123');
  console.log('  Instrutor: maria.santos@mastchieve.com / instructor123');
  console.log('  Atleta:    sofia.ferreira@atleta.mastchieve.com / student123');
  console.log('══════════════════════════════════════\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
