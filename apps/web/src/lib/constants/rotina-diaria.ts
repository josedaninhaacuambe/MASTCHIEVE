// Duplicado apenas para feedback visual imediato no formulário — o servidor
// (apps/api/src/common/constants/agua-parametros.constants.ts) é a única fonte de verdade.
export const AGUA_LIMITES = {
  temperatura: { min: 15, max: 36 },
  ph: { min: 6.0, max: 9.0 },
  cloro: { min: 0, max: 10 },
} as const;
