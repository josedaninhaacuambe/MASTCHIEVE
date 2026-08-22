'use client';

// recharts (com d3-scale/d3-shape/d3-array/react-smooth, etc.) é uma das
// dependências mais pesadas do bundle — importada estaticamente, entra no
// grafo de módulos de CADA página que a usa, tornando a compilação
// sob-demanda do `next dev` (e o bundle inicial em produção) muito mais lenta.
// Ao importar via `next/dynamic`, o webpack isola-a num chunk próprio,
// carregado só quando o gráfico é efectivamente renderizado.
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type * as Recharts from 'recharts';

function lazy<K extends keyof typeof Recharts>(name: K) {
  return dynamic(
    () => import('recharts').then((m) => m[name] as ComponentType<any>),
    { ssr: false },
  ) as unknown as (typeof Recharts)[K];
}

export const AreaChart = lazy('AreaChart');
export const Area = lazy('Area');
export const LineChart = lazy('LineChart');
export const Line = lazy('Line');
export const BarChart = lazy('BarChart');
export const Bar = lazy('Bar');
export const Cell = lazy('Cell');
export const XAxis = lazy('XAxis');
export const YAxis = lazy('YAxis');
export const CartesianGrid = lazy('CartesianGrid');
export const Tooltip = lazy('Tooltip');
export const Legend = lazy('Legend');
export const ResponsiveContainer = lazy('ResponsiveContainer');
