const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const assistente = await p.user.findFirst({ where: { role: 'ASSISTENTE_ADMIN' }, select: { id: true, email: true, password: true } });
  const gestorRh = await p.user.findFirst({ where: { role: 'GESTOR_RH' }, select: { id: true, email: true, password: true } });
  const admin = await p.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, email: true, password: true } });

  const funcionario = await p.funcionario.findFirst({ select: { id: true, salarioBase: true, firstName: true } });

  // minor student with a linked primary parent
  const students = await p.student.findMany({
    select: { id: true, firstName: true, dateOfBirth: true, phone: true,
      parents: { select: { isPrimary: true, parent: { select: { id: true, phone: true, userId: true } } } } },
  });
  const now = Date.now();
  const minorWithParent = students.find(s => {
    const age = (now - new Date(s.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age < 18 && s.parents.length > 0;
  });

  // a PARENT user + their own child id, and a DIFFERENT student they don't own
  const parentLink = await p.studentParent.findFirst({ select: { studentId: true, parentId: true, parent: { select: { userId: true } } } });
  const parentUser = parentLink ? await p.user.findUnique({ where: { id: parentLink.parent.userId }, select: { id: true, email: true, password: true } }) : null;
  const otherStudent = await p.student.findFirst({ where: { id: { not: parentLink?.studentId } }, select: { id: true } });

  console.log(JSON.stringify({
    assistente, gestorRh, admin, funcionario,
    minorWithParent: minorWithParent ? { id: minorWithParent.id, firstName: minorWithParent.firstName, dateOfBirth: minorWithParent.dateOfBirth, phone: minorWithParent.phone, parents: minorWithParent.parents } : null,
    parentLink, parentUser, otherStudent,
  }, null, 2));
})().catch(console.error).finally(() => p.$disconnect());
