import { NextResponse, type NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP com nonce por request, só para /doar (coleta cartão/CPF).
 *
 * A página já é dinâmica (lê `searchParams`), então gerar um nonce por request não
 * tem custo de cache (ao contrário da home, que é estática com ISR — ver
 * next.config.ts). Com `'strict-dynamic'`, os scripts que o BotID injeta via
 * `document.createElement("script")` (os paths /149e9513-.../a-4-a/c.js e
 * .../p.js, reescritos same-origin pelo withBotId) herdam a confiança do chunk
 * já autorizado pelo nonce, sem precisar listar domínios adicionais.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? "" : " 'unsafe-eval'"}`,
    // Ver next.config.ts: 'unsafe-inline' aqui também é inevitável (React/GSAP/Lenis
    // setam atributo style="" inline, sem mecanismo de nonce para isso).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export const config = { matcher: ["/doar"] };
