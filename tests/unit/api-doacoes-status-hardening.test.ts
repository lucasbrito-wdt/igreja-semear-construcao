import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/doacoes/[id]/status/route";

const VALID_UUID = "11111111-2222-4333-8444-555555555555";

function makeRequest(id: string) {
  return new Request(`https://site.test/api/doacoes/${id}/status`);
}

describe("GET /api/doacoes/[id]/status — hardening (auditoria front)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "https://api.test");
    vi.stubEnv("CAMPAIGN_SLUG", "templo");
    vi.stubEnv("CAMPAIGN_PROXY_TOKEN", "proxy-secret");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("AC-N10 GIVEN status fora da allowlist (200,404,429) WHEN GET status THEN 502 generico sem repassar o corpo", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "detalhe interno da API", trace: "..." }), {
        status: 500,
      })
    );

    const res = await GET(makeRequest(VALID_UUID), {
      params: Promise.resolve({ id: VALID_UUID }),
    });

    expect(res.status).toBe(502);
    const json = (await res.json()) as { message: string };
    expect(typeof json.message).toBe("string");
    expect(JSON.stringify(json)).not.toContain("detalhe interno da API");
    expect(JSON.stringify(json)).not.toContain("trace");
  });

  it("AC-N10 GIVEN GET status WHEN chama a API THEN envia signal de timeout (AbortSignal)", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: VALID_UUID, status: "pago", pago: true }), {
        status: 200,
      })
    );

    await GET(makeRequest(VALID_UUID), {
      params: Promise.resolve({ id: VALID_UUID }),
    });

    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});
