/**
 * Monta a URL da API Laravel para a campanha configurada em CAMPAIGN_SLUG.
 * Usado pelos proxies em src/app/api/doacoes/**.
 */
export function campaignUpstreamUrl(path: string): string {
  return `${process.env.API_URL}/campanhas/${process.env.CAMPAIGN_SLUG}${path}`;
}

/**
 * Extrai um identificador seguro para log a partir de uma falha ao chamar o
 * upstream (rede, timeout ou URL malformada por env ausente). Nunca inclui
 * mensagem, stack ou dados do payload.
 */
export function upstreamErrorName(error: unknown): string {
  return error instanceof Error ? error.name : "erro desconhecido";
}

/**
 * Configuração obrigatória para falar com a API upstream. Lida em um único
 * lugar para que a falta de qualquer variável feche o proxy (fail-closed)
 * antes de qualquer fetch, em vez de vazar uma URL malformada.
 */
export interface UpstreamConfig {
  apiUrl: string;
  campaignSlug: string;
  proxyToken: string;
}

/**
 * Lê e valida API_URL, CAMPAIGN_SLUG e CAMPAIGN_PROXY_TOKEN. Retorna `null`
 * (sem nunca logar valores) quando alguma está ausente/vazia, ou quando
 * API_URL usa `http://` em produção.
 */
export function resolveUpstreamConfig(): UpstreamConfig | null {
  const apiUrl = process.env.API_URL;
  const campaignSlug = process.env.CAMPAIGN_SLUG;
  const proxyToken = process.env.CAMPAIGN_PROXY_TOKEN;

  if (!apiUrl || !campaignSlug || !proxyToken) {
    return null;
  }

  if (apiUrl.startsWith("http://") && process.env.NODE_ENV === "production") {
    return null;
  }

  return { apiUrl, campaignSlug, proxyToken };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Valida formato de UUID (v1-v8), usado para ids e para Idempotency-Key. */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
