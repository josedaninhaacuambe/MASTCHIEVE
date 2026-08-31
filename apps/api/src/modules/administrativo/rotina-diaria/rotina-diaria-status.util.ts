export type RotinaInstrutorStatus = 'AGUARDA_ADMIN' | 'INCOMPLETO' | 'COMPLETO';
export type RotinaInstrutorPendencia = 'agua' | 'equipamentos' | 'materiais';

type RotinaComMateriais = {
  aguaRegistadoPorId: string | null;
  equipamentosRegistadoPorId: string | null;
  materiais: { instrutorId: string }[];
} | null;

export function calcularStatusInstrutor(
  rotina: RotinaComMateriais,
  instructorId: string,
): { status: RotinaInstrutorStatus; pendentes: RotinaInstrutorPendencia[] } {
  if (!rotina) return { status: 'AGUARDA_ADMIN', pendentes: [] };

  const pendentes: RotinaInstrutorPendencia[] = [];
  if (!rotina.aguaRegistadoPorId) pendentes.push('agua');
  if (!rotina.equipamentosRegistadoPorId) pendentes.push('equipamentos');
  if (!rotina.materiais.some((m) => m.instrutorId === instructorId)) pendentes.push('materiais');

  return { status: pendentes.length ? 'INCOMPLETO' : 'COMPLETO', pendentes };
}
