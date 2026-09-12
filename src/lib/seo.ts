/**
 * Configuracao central de SEO da campanha: URL base, textos padrao de
 * title/description/keywords e o builder do JSON-LD (@graph). Reutiliza
 * CONTATOS/LINKS de content.ts para nao duplicar dados reais da igreja.
 */

import { CONTATOS, LINKS } from "@/lib/content";

// process.env.NEXT_PUBLIC_SITE_URL as vezes chega como string vazia em
// alguns ambientes de build — o `||` garante o fallback de producao.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://construcao.igrejasemear.com.br";

export const SITE_NAME = "Igreja Semear Guarabira";

export const SEO = {
  home: {
    title: "Construção do Novo Templo da Igreja Semear em Guarabira-PB",
    description:
      "Ajude a construir o novo templo da Igreja Semear em Guarabira-PB. Doe via Pix, cartão ou boleto, uma vez ou todo mês, e acompanhe a obra com transparência.",
    ogTitle: "Cada tijolo é uma semente — Igreja Semear",
    ogDescription:
      "O novo templo da Igreja Semear em Guarabira-PB está subindo graças a quem doa. Faça parte da obra: Pix, cartão ou boleto, uma vez ou todo mês.",
  },
  doar: {
    title: "Doar",
    description:
      "Escolha o valor e a forma de pagamento — Pix, cartão ou boleto, doação única ou mensal — e ajude a construir o novo templo da Igreja Semear em Guarabira-PB.",
    ogTitle: "Faça parte da obra — Igreja Semear",
    ogDescription:
      "Doe por Pix, cartão ou boleto, uma vez ou todo mês, e ajude a construir o novo templo da Igreja Semear em Guarabira-PB.",
  },
} as const;

export const KEYWORDS = [
  "igreja em Guarabira",
  "igreja batista Guarabira",
  "Igreja Semear",
  "doação igreja",
  "construção de templo",
  "oferta online",
  "dízimo online",
  "igreja Guarabira PB",
  "Paraíba",
];

/** Escapa `<` no JSON serializado para evitar quebra de script/XSS no dangerouslySetInnerHTML. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Monta o @graph de Organization/WebSite/WebPage usado no layout raiz. */
export function buildJsonLd() {
  const church = {
    "@type": "Church",
    "@id": `${SITE_URL}/#church`,
    name: "Igreja Batista Semear",
    alternateName: "Igreja Semear",
    url: LINKS.site,
    logo: `${SITE_URL}/icons/icon-512.png`,
    image: `${SITE_URL}/images/fachada.jpg`,
    email: CONTATOS.email,
    telephone: "+5583988564852",
    address: {
      "@type": "PostalAddress",
      streetAddress: `${CONTATOS.endereco}, ${CONTATOS.bairro}`,
      addressLocality: "Guarabira",
      addressRegion: "PB",
      addressCountry: "BR",
    },
    hasMap: LINKS.maps,
    sameAs: [LINKS.instagram, LINKS.youtube, LINKS.site],
    taxID: CONTATOS.cnpj,
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "pt-BR",
    publisher: { "@id": `${SITE_URL}/#church` },
  };

  const webPage = {
    "@type": "WebPage",
    "@id": `${SITE_URL}/#webpage`,
    url: SITE_URL,
    name: SEO.home.title,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#church` },
    potentialAction: {
      "@type": "DonateAction",
      target: `${SITE_URL}/doar`,
      recipient: { "@id": `${SITE_URL}/#church` },
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [church, website, webPage],
  };
}

/** Breadcrumb da pagina /doar (Início > Doar). */
export function buildDoarBreadcrumbJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Doar", item: `${SITE_URL}/doar` },
    ],
  };
}
