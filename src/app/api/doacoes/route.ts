import { isIP } from "node:net";

import { checkBotId } from "botid/server";

import {
  campaignUpstreamUrl,
  isValidUuid,
  resolveUpstreamConfig,
  upstreamErrorName,
} from "@/lib/api/upstream";

const PASSTHROUGH_STATUSES = new Set([201, 402, 403, 404, 422, 429]);
const TIMEOUT_MS = 25_000;
const GENERIC_ERROR_MESSAGE =
  "Não foi possível processar sua doação agora. Tente novamente em instantes.";

function upstreamError(): Response {
  return Response.json({ message: GENERIC_ERROR_MESSAGE }, { status: 502 });
}

function configError(): Response {
  console.error("[doacoes] configuracao ausente");
  return Response.json({ message: GENERIC_ERROR_MESSAGE }, { status: 503 });
}

function getDonorIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const candidate = (
    forwardedFor ? forwardedFor.split(",")[0] : request.headers.get("x-real-ip")
  )?.trim();

  if (!candidate && process.env.NODE_ENV !== "production") {
    return "127.0.0.1";
  }

  return candidate && isIP(candidate) !== 0 ? candidate : null;
}

export async function POST(request: Request): Promise<Response> {
  const config = resolveUpstreamConfig();
  if (!config) {
    return configError();
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey && !isValidUuid(idempotencyKey)) {
    return Response.json(
      { message: "Identificador de idempotência inválido." },
      { status: 400 }
    );
  }

  const botCheck = await checkBotId();
  if (botCheck.isBot) {
    return Response.json({ message: "Requisição bloqueada." }, { status: 403 });
  }

  const body = await request.text();
  const donorIp = getDonorIp(request);

  try {
    const upstreamResponse = await fetch(campaignUpstreamUrl("/doacoes"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Proxy-Token": config.proxyToken,
        ...(donorIp ? { "X-Donor-Ip": donorIp } : {}),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!PASSTHROUGH_STATUSES.has(upstreamResponse.status)) {
      console.error("[doacoes] upstream falhou", upstreamResponse.status);
      return upstreamError();
    }

    const json = await upstreamResponse.json();
    return Response.json(json, { status: upstreamResponse.status });
  } catch (error) {
    console.error("[doacoes] upstream falhou", upstreamErrorName(error));
    return upstreamError();
  }
}
