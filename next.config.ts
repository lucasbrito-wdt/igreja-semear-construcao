import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const isProd = process.env.NODE_ENV === "production";

// script-src: sem nonce aqui porque esta CSP cobre a home ("/"), que e estatica com
// ISR de 60s (export const revalidate = 60 em src/app/page.tsx). O App Router injeta
// scripts inline de bootstrap do RSC (`self.__next_f.push(...)`) cujo conteudo muda a
// cada build/pagina, entao hash nao serve, e usar nonce exigiria tornar a home
// dinamica por request (perderia o cache estático/ISR). Ver src/proxy.ts para a
// rota /doar, que ja e dinamica (le `searchParams`) e por isso recebe nonce sem custo.
// 'unsafe-eval' só em dev: o Turbopack/React usam eval para reconstruir stack traces
// de erro no browser; nunca necessário em produção.
const scriptSrc = `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`;

// connect-src: 'self' cobre o fetch para /api/doacoes (proxy interno) e as chamadas do
// BotID, que são same-origin porque o withBotId reescreve os paths do desafio
// (/149e9513-.../a-4-a/c.js e /149e9513-.../p.js) para a API da Vercel no servidor —
// o browser nunca faz fetch cross-origin. `ws:`/`wss:` só em dev, para o HMR.
const connectSrc = `connect-src 'self'${isProd ? "" : " ws: wss:"}`;

// style-src precisa de 'unsafe-inline' com ou sem nonce em script-src: React (JSX
// `style={{...}}`) e GSAP/Lenis setam o atributo `style=""` diretamente no HTML/DOM, e
// CSP não tem mecanismo de nonce para atributos de estilo (só para elementos <style> e
// <script>). Risco residual é baixo: um atacante que já conseguisse injetar HTML
// arbitrário via XSS teria vetores mais graves que apenas CSS injection.
const contentSecurityPolicy = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  // data: para o QR Code do Pix (data:image/png;base64,... em TelaPixAguardando).
  "img-src 'self' data:",
  // next/font (Archivo, next/font/google) faz self-host em /_next/static/media no
  // build; não há requisição a fonts.googleapis.com em runtime.
  "font-src 'self' data:",
  connectSrc,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // payment=() porque o site não usa a Payment Request API (cartão é enviado via
  // fetch comum para o proxy interno, não via navigator.credentials/PaymentRequest).
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // Redundante com `frame-ancestors 'none'` da CSP, mas mantido para navegadores sem
  // suporte a CSP2 (defesa em profundidade contra clickjacking do formulário).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // CSP global, exceto /doar: a rota /doar define a sua própria CSP (com nonce)
      // em src/proxy.ts, mais restritiva por não precisar de 'unsafe-inline' em
      // script-src.
      {
        source: "/:path((?!doar$).*)",
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy }],
      },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default withBotId(nextConfig);
