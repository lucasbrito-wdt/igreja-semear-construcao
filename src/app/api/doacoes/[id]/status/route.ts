import {
  campaignUpstreamUrl,
  isValidUuid,
  resolveUpstreamConfig,
  upstreamErrorName,
} from "@/lib/api/upstream";

const PASSTHROUGH_STATUSES = new Set([200, 404, 429]);
const TIMEOUT_MS = 10_000;
const GENERIC_ERROR_MESSAGE =
  "Não foi possível consultar o status agora. Tente novamente em instantes.";

function jsonNoStore(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  if (!isValidUuid(id)) {
    return jsonNoStore({ message: "Identificador inválido." }, 400);
  }

  const config = resolveUpstreamConfig();
  if (!config) {
    console.error("[doacoes-status] configuracao ausente");
    return jsonNoStore({ message: GENERIC_ERROR_MESSAGE }, 503);
  }

  try {
    const upstreamResponse = await fetch(campaignUpstreamUrl(`/doacoes/${id}/status`), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!PASSTHROUGH_STATUSES.has(upstreamResponse.status)) {
      console.error("[doacoes-status] upstream falhou", upstreamResponse.status);
      return jsonNoStore({ message: GENERIC_ERROR_MESSAGE }, 502);
    }

    const json = await upstreamResponse.json();
    return jsonNoStore(json, upstreamResponse.status);
  } catch (error) {
    console.error("[doacoes-status] upstream falhou", upstreamErrorName(error));
    return jsonNoStore({ message: GENERIC_ERROR_MESSAGE }, 502);
  }
}
