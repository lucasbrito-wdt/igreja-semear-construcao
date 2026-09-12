export type CampaignStats = {
  meta: number;
  arrecadado: number;
  pct: number;
  doadores: number;
  mensaisAtivos: number;
  atualizadoEm: string;
};

/**
 * Limita a 1 casa decimal e no maximo 100%.
 * Espelha a formula do protototipo original (design/prototype/index.html).
 */
export function computePct(arrecadado: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.min(100, Math.round((arrecadado / meta) * 1000) / 10);
}
