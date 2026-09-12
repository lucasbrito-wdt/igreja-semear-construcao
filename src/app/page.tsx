import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { Porque } from "@/components/home/Porque";
import { Projeto } from "@/components/home/Projeto";
import { Etapas } from "@/components/home/Etapas";
import { Impacto } from "@/components/home/Impacto";
import { Citacao } from "@/components/home/Citacao";
import { Contas } from "@/components/home/Contas";
import { Visite } from "@/components/home/Visite";
import { CtaFinal } from "@/components/home/CtaFinal";
import { getCampaignStats } from "@/lib/campaign/stats";

export const revalidate = 60;

export default async function Home() {
  const stats = await getCampaignStats();

  return (
    <main>
      <Hero stats={stats} />
      <Marquee />
      <Porque />
      <Projeto />
      <Etapas />
      <Impacto />
      <Citacao />
      <Contas stats={stats} />
      <Visite />
      <CtaFinal />
    </main>
  );
}
