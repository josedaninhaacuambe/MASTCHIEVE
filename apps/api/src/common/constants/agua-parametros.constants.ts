export const AGUA_LIMITES = {
  temperatura: { min: 15, max: 36 }, // °C
  ph: { min: 6.0, max: 9.0 },
  cloro: { min: 0, max: 10 }, // ppm
} as const;
