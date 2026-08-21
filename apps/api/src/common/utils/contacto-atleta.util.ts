const IDADE_MAIORIDADE = 18;

export interface StudentParaContacto {
  dateOfBirth: Date;
  phone?: string | null;
  emergencyPhone?: string | null;
  parents?: {
    isPrimary: boolean;
    parent: { phone: string; firstName?: string; lastName?: string };
  }[];
}

export interface ContactoAtleta {
  telefone: string | null;
  viaEncarregado: boolean;
  nomeEncarregado?: string;
}

export function calcularIdade(dateOfBirth: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dateOfBirth.getFullYear();
  const aindaNaoFezAnos =
    hoje.getMonth() < dateOfBirth.getMonth() ||
    (hoje.getMonth() === dateOfBirth.getMonth() && hoje.getDate() < dateOfBirth.getDate());
  if (aindaNaoFezAnos) idade--;
  return idade;
}

export function resolveContactoAtleta(student: StudentParaContacto): ContactoAtleta {
  const isMenor = calcularIdade(new Date(student.dateOfBirth)) < IDADE_MAIORIDADE;

  if (isMenor) {
    const encarregado =
      student.parents?.find((p) => p.isPrimary)?.parent ?? student.parents?.[0]?.parent;
    if (encarregado?.phone) {
      return {
        telefone: encarregado.phone,
        viaEncarregado: true,
        nomeEncarregado: [encarregado.firstName, encarregado.lastName].filter(Boolean).join(' ') || undefined,
      };
    }
  }

  return { telefone: student.phone || student.emergencyPhone || null, viaEncarregado: false };
}
