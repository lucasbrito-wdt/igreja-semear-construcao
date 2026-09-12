import type { Metadata } from "next";

import { DoacaoFlow } from "@/components/doar/DoacaoFlow";
import { getCampaignStats } from "@/lib/campaign/stats";
import type { Frequencia } from "@/components/doar/types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Doar | Igreja Semear",
  description:
    "Escolha a frequência, o valor e a forma de pagamento da sua doação para a construção do novo templo da Igreja Semear.",
};

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
    </main>
  );
}
