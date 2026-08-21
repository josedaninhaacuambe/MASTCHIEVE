export const FAIXAS_ETARIAS = [
  { chave: '0-2', label: '0–2 anos', min: 0, max: 2 },
  { chave: '3-5', label: '3–5 anos', min: 3, max: 5 },
  { chave: '6-9', label: '6–9 anos', min: 6, max: 9 },
  { chave: '10-13', label: '10–13 anos', min: 10, max: 13 },
  { chave: '14-17', label: '14–17 anos', min: 14, max: 17 },
  { chave: '18+', label: '18+ anos', min: 18, max: Infinity },
] as const;

export function classificarFaixaEtaria(idade: number): string {
  return FAIXAS_ETARIAS.find((f) => idade >= f.min && idade <= f.max)?.chave ?? '18+';
}

export interface FaixaEtariaPresenca {
  faixa: string;
  label: string;
  total: number;
  presentes: number;
  taxa: number;
}

export function calcularPresencasPorFaixaEtaria(
  registros: { presente: boolean; idade: number }[],
): FaixaEtariaPresenca[] {
  return FAIXAS_ETARIAS.map(({ chave, label }) => {
    const doGrupo = registros.filter((r) => classificarFaixaEtaria(r.idade) === chave);
    const total = doGrupo.length;
    const presentes = doGrupo.filter((r) => r.presente).length;
    return { faixa: chave, label, total, presentes, taxa: total ? Math.round((presentes / total) * 1000) / 10 : 0 };
  });
}
