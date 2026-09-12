import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCampaignStats } from "@/lib/campaign/stats";
import { FALLBACK_STATS } from "@/lib/campaign/fallback";

describe("getCampaignStats", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "https://api.test");
    vi.stubEnv("CAMPAIGN_SLUG", "templo");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("AC-N6 GIVEN API de campanha ok WHEN getCampaignStats THEN mapeia snake_case para CampaignStats", async () => {
    const upstream = {
      slug: "templo",
      titulo: "x",
      meta: 2_400_000,
      arrecadado: 1_500_000,
      percentual: 62.5,
      doadores: 10,
      mensais_ativos: 3,
      atualizado_em: "2026-09-12T10:00:00Z",
    };
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify(upstream), { status: 200 })
    );

    const stats = await getCampaignStats();

    expect(stats).toEqual({
      meta: 2_400_000,
      arrecadado: 1_500_000,
      pct: 62.5,
      doadores: 10,
      mensaisAtivos: 3,
      atualizadoEm: "2026-09-12T10:00:00Z",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.test/campanhas/templo",
      expect.objectContaining({
        next: { revalidate: 60, tags: ["campaign-stats"] },
      })
    );
  });

  it("AC-N7 GIVEN fetch rejeita WHEN getCampaignStats THEN retorna FALLBACK_STATS", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

    const stats = await getCampaignStats();

    expect(stats).toEqual(FALLBACK_STATS);
  });

  it("AC-N7 GIVEN API responde 500 WHEN getCampaignStats THEN retorna FALLBACK_STATS", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "erro" }), { status: 500 })
    );

    const stats = await getCampaignStats();

    expect(stats).toEqual(FALLBACK_STATS);
  });
});
