import { computePct, type CampaignStats } from "./types";

const META = 2_400_000;
const ARRECADADO = 1_386_500;

/**
 * Valores de demonstracao do protototipo (design/prototype/index.html).
 * Sera substituido por uma fonte real (Asaas) em uma wave posterior.
 */
export const FALLBACK_STATS: CampaignStats = {
  meta: META,
  arrecadado: ARRECADADO,
  pct: computePct(ARRECADADO, META),
  doadores: 412,
  mensaisAtivos: 138,
  atualizadoEm: "2026-09-01T00:00:00-03:00",
};
