import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/doacoes/route";

const BASE_BODY = {
  frequencia: "unica",
  metodo: "pix",
  valor: 50,
  nome: "Fulano de Tal",
  email: "fulano@example.com",
  cpf_cnpj: "12345678909",
  recibo: false,
};

const VALID_IDEMPOTENCY_KEY = "11111111-2222-4333-8444-555555555555";

function makeRequest(
  body: unknown,
  headers: Record<string, string> = { "x-forwarded-for": "203.0.113.7, 10.0.0.1" }
) {
  return new Request("https://site.test/api/doacoes", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/doacoes — hardening (auditoria front)", () => {
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

  it.each(["CAMPAIGN_PROXY_TOKEN", "API_URL", "CAMPAIGN_SLUG"] as const)(
    "AC-N8 GIVEN %s ausente/vazio WHEN POST /api/doacoes THEN 503 generico e fetch nao e chamado",
    async (envVar) => {
      vi.stubEnv(envVar, "");

      const res = await POST(makeRequest(BASE_BODY));

      expect(res.status).toBe(503);
      const json = (await res.json()) as { message: string };
      expect(typeof json.message).toBe("string");
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );

  it("AC-N9 GIVEN NODE_ENV=production e API_URL com http:// WHEN POST THEN 503 e fetch nao e chamado", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_URL", "http://api.test");

    const res = await POST(makeRequest(BASE_BODY));

    expect(res.status).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("AC-N9 GIVEN NODE_ENV=test e API_URL http://localhost WHEN POST THEN aceita e encaminha", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("API_URL", "http://localhost:8000");
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "abc" }), { status: 201 })
    );

    const res = await POST(makeRequest(BASE_BODY));

    expect(res.status).not.toBe(503);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("AC-N11 GIVEN x-forwarded-for invalido (nao e IP) WHEN POST THEN X-Donor-Ip nao e enviado; GIVEN IPv6 valido THEN e repassado", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "abc" }), { status: 201 })
    );

    await POST(makeRequest(BASE_BODY, { "x-forwarded-for": "abc, 1.2.3.4" }));
    const [, invalidInit] = vi.mocked(global.fetch).mock.calls[0];
    const invalidHeaders = new Headers(invalidInit?.headers);
    expect(invalidHeaders.has("X-Donor-Ip")).toBe(false);

    vi.mocked(global.fetch).mockClear();
    await POST(
      makeRequest(BASE_BODY, { "x-forwarded-for": "2001:db8::1" })
    );
    const [, validInit] = vi.mocked(global.fetch).mock.calls[0];
    const validHeaders = new Headers(validInit?.headers);
    expect(validHeaders.get("X-Donor-Ip")).toBe("2001:db8::1");
  });

  it("AC-N12 GIVEN Idempotency-Key valida WHEN POST THEN repassa identica a API", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "abc" }), { status: 201 })
    );

    await POST(
      makeRequest(BASE_BODY, {
        "x-forwarded-for": "203.0.113.7",
        "idempotency-key": VALID_IDEMPOTENCY_KEY,
      })
    );

    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Idempotency-Key")).toBe(VALID_IDEMPOTENCY_KEY);
  });

  it("AC-N12 GIVEN Idempotency-Key invalida (nao-UUID) WHEN POST THEN 400 sem chamar a API", async () => {
    const res = await POST(
      makeRequest(BASE_BODY, {
        "x-forwarded-for": "203.0.113.7",
        "idempotency-key": "nao-e-um-uuid",
      })
    );

    expect(res.status).toBe(400);
    const json = (await res.json()) as { message: string };
    expect(typeof json.message).toBe("string");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("AC-N12 GIVEN Idempotency-Key ausente WHEN POST THEN encaminha sem o header", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "abc" }), { status: 201 })
    );

    await POST(makeRequest(BASE_BODY));

    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.has("Idempotency-Key")).toBe(false);
  });
});
