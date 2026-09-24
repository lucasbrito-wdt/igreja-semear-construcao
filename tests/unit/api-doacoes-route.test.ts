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

describe("POST /api/doacoes", () => {
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

  it("AC-N2 GIVEN requisicao valida WHEN POST THEN encaminha com X-Proxy-Token e X-Donor-Ip do primeiro IP de x-forwarded-for", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "abc" }), { status: 201 })
    );

    await POST(makeRequest(BASE_BODY));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("https://api.test/campanhas/templo/doacoes");
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("X-Proxy-Token")).toBe("proxy-secret");
    expect(headers.get("X-Donor-Ip")).toBe("203.0.113.7");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify(BASE_BODY));
  });

  it("AC-N2 GIVEN sem x-forwarded-for WHEN POST THEN usa x-real-ip", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "abc" }), { status: 201 })
    );

    await POST(makeRequest(BASE_BODY, { "x-real-ip": "198.51.100.9" }));

    const [, init] = vi.mocked(global.fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("X-Donor-Ip")).toBe("198.51.100.9");
  });

  it.each([201, 402, 422])(
    "AC-N3 GIVEN API responde %i WHEN POST THEN repassa status e corpo",
    async (status) => {
      const upstreamJson = { message: `resposta ${status}` };
      vi.mocked(global.fetch).mockResolvedValue(
        new Response(JSON.stringify(upstreamJson), { status })
      );

      const res = await POST(makeRequest(BASE_BODY));

      expect(res.status).toBe(status);
      await expect(res.json()).resolves.toEqual(upstreamJson);
    }
  );

  it("AC-N4 GIVEN API 5xx WHEN POST THEN 502 com mensagem generica sem vazar corpo da API", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ segredo: "detalhe interno da API" }), {
        status: 500,
      })
    );

    const res = await POST(makeRequest(BASE_BODY));

    expect(res.status).toBe(502);
    const json = (await res.json()) as { message: string };
    expect(typeof json.message).toBe("string");
    expect(JSON.stringify(json)).not.toContain("segredo");
    expect(JSON.stringify(json)).not.toContain("detalhe interno da API");
  });

  it("AC-N4 GIVEN timeout/AbortError no fetch WHEN POST THEN 502", async () => {
    vi.mocked(global.fetch).mockRejectedValue(
      Object.assign(new Error("timeout"), { name: "AbortError" })
    );

    const res = await POST(makeRequest(BASE_BODY));

    expect(res.status).toBe(502);
  });

  it("AC-N4 GIVEN erro 500 com numero de cartao no body WHEN POST THEN nao loga o numero do cartao", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "erro interno" }), { status: 500 })
    );

    const bodyComCartao = {
      ...BASE_BODY,
      metodo: "cartao",
      cartao: {
        titular: "Fulano de Tal",
        numero: "4111111111111111",
        mes: "12",
        ano: "2030",
        cvv: "123",
      },
    };

    await POST(makeRequest(bodyComCartao));

    const allLoggedText = [...logSpy.mock.calls, ...errorSpy.mock.calls]
      .flat()
      .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
      .join(" ");
    expect(allLoggedText).not.toContain("4111111111111111");
  });
});
