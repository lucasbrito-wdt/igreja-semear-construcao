import { z } from "zod";

import { campaignUpstreamUrl, upstreamErrorName } from "@/lib/api/upstream";
import { FALLBACK_STATS } from "@/lib/campaign/fallback";
import type { CampaignStats } from "@/lib/campaign/types";

const upstreamCampaignSchema = z.object({
  meta: z.number(),
  arrecadado: z.number(),
  percentual: z.number(),
  doadores: z.number(),
  mensais_ativos: z.number(),
  atualizado_em: z.string(),
});

/**
 * Busca os numeros da campanha na API Laravel e mapeia para CampaignStats.
 * Em qualquer falha (rede, status nao-ok ou payload invalido) retorna FALLBACK_STATS.
 */
export async function getCampaignStats(): Promise<CampaignStats> {
  try {
    const response = await fetch(campaignUpstreamUrl(""), {
      next: { revalidate: 60, tags: ["campaign-stats"] },
    });

    if (!response.ok) {
      return FALLBACK_STATS;
    }

    const upstream = upstreamCampaignSchema.parse(await response.json());

    return {
      meta: upstream.meta,
      arrecadado: upstream.arrecadado,
      pct: upstream.percentual,
      doadores: upstream.doadores,
      mensaisAtivos: upstream.mensais_ativos,
      atualizadoEm: upstream.atualizado_em,
    };
  } catch (error) {
    console.error("[campaign-stats] falhou", upstreamErrorName(error));
    return FALLBACK_STATS;
  }
}
