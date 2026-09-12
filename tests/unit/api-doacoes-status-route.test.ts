import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/doacoes/[id]/status/route";

const VALID_UUID = "11111111-2222-4333-8444-555555555555";

function makeRequest(id: string) {
  return new Request(`https://site.test/api/doacoes/${id}/status`);
}

describe("GET /api/doacoes/[id]/status", () => {
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

  it("AC-N5 GIVEN id nao-UUID WHEN GET status THEN 400 sem chamar a API", async () => {
    const res = await GET(makeRequest("abc"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("AC-N5 GIVEN uuid valido WHEN GET status THEN encaminha e repassa 200", async () => {
    const upstreamJson = { id: VALID_UUID, status: "pago", pago: true };
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify(upstreamJson), { status: 200 })
    );

    const res = await GET(makeRequest(VALID_UUID), {
      params: Promise.resolve({ id: VALID_UUID }),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.test/campanhas/templo/doacoes/${VALID_UUID}/status`,
      expect.anything()
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(upstreamJson);
  });
});
