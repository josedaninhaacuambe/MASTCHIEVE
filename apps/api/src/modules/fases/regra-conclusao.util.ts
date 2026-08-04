export interface CriterioDef {
  nome: string;
  obrigatoria: boolean;
}

export interface AvaliacaoInput {
  criterioIndex: number;
  valor: number;
}

export interface ResultadoRegraConclusao {
  aprovado: boolean;
  soma: number;
  totalMinimo: number;
  criteriosFaltando: string[];
  criteriosAbaixoMinimo: { nome: string; valor: number; minimo: number }[];
}

// Regra de aprovação da "avaliação final": todas as habilidades pontuadas,
// nenhuma abaixo do mínimo (obrigatória→4, geral→3, não-compensação) e soma
// total ≥ totalMinimo do módulo. Nunca lança exceção — apenas descreve o resultado.
export function avaliarRegraConclusao(
  criterios: CriterioDef[],
  totalMinimo: number,
  avaliacoes: AvaliacaoInput[],
): ResultadoRegraConclusao {
  const criteriosFaltando: string[] = [];
  const criteriosAbaixoMinimo: { nome: string; valor: number; minimo: number }[] = [];
  let soma = 0;

  criterios.forEach((criterio, index) => {
    const avaliacao = avaliacoes.find(a => a.criterioIndex === index);
    if (!avaliacao) {
      criteriosFaltando.push(criterio.nome);
      return;
    }
    soma += avaliacao.valor;
    const minimo = criterio.obrigatoria ? 4 : 3;
    if (avaliacao.valor < minimo) {
      criteriosAbaixoMinimo.push({ nome: criterio.nome, valor: avaliacao.valor, minimo });
    }
  });

  const aprovado = criteriosFaltando.length === 0 && criteriosAbaixoMinimo.length === 0 && soma >= totalMinimo;

  return { aprovado, soma, totalMinimo, criteriosFaltando, criteriosAbaixoMinimo };
}
