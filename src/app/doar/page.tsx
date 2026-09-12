import type { Metadata } from "next";

import { DoacaoFlow } from "@/components/doar/DoacaoFlow";
import { getCampaignStats } from "@/lib/campaign/stats";
import type { Frequencia } from "@/components/doar/types";
import { SEO, SITE_NAME, buildDoarBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo";
import styles from "./page.module.css";

// openGraph/twitter sao mesclados de forma rasa entre segmentos (o objeto do
// filho substitui o do pai por inteiro), entao repetimos os campos fixos
// (type, locale, siteName, card) para nao perde-los na pagina /doar.
export const metadata: Metadata = {
  title: SEO.doar.title,
  description: SEO.doar.description,
  alternates: { canonical: "/doar" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/doar",
    siteName: SITE_NAME,
    title: SEO.doar.ogTitle,
    description: SEO.doar.ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.doar.ogTitle,
    description: SEO.doar.ogDescription,
  },
};

const breadcrumbJsonLd = buildDoarBreadcrumbJsonLd();

const VALOR_MIN = 10;
const VALOR_MAX = 100000;

function parseFrequencia(raw?: string): Frequencia {
  return raw === "mensal" ? "mensal" : "unica";
}

function parseValorInicial(raw?: string): number | null {
  if (!raw) return null;
  const numero = Number(raw);
  if (!Number.isFinite(numero) || numero < VALOR_MIN || numero > VALOR_MAX) return null;
  return Math.round(numero * 100) / 100;
}

type DoarSearchParams = { freq?: string; valor?: string };

export default async function DoarPage({
  searchParams,
}: {
  searchParams: Promise<DoarSearchParams>;
}) {
  const params = await searchParams;
  const campaignStats = await getCampaignStats();

  return (
    <main className={`smWrap ${styles.main}`}>
      <DoacaoFlow
        frequenciaInicial={parseFrequencia(params.freq)}
        valorInicial={parseValorInicial(params.valor)}
        campaignStats={campaignStats}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
    </main>
  );
}
