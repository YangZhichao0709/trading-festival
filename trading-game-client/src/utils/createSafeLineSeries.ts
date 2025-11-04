// src/utils/createSafeLineSeries.ts
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

/**
 * Lightweight-charts v5 では addLineSeries() が無い or Tree-Shaking されている場合がある。
 * そのため safe にラインシリーズを生成するヘルパー。
 */
export function createSafeLineSeries(chart: IChartApi): ISeriesApi<"Line"> {
  // パッケージによっては従来の addLineSeries が存在する場合もある
  if (typeof (chart as any).addLineSeries === 'function') {
    return (chart as any).addLineSeries();
  }

  // v5 の addSeries({ type: 'Line' }) 形式にフォールバック。
  // ただし addSeries には最低限の internal 定義が必要なため any で回避。
  const series = (chart as any).addSeries({
    type: 'Line',
  });

  return series as ISeriesApi<"Line">;
}
