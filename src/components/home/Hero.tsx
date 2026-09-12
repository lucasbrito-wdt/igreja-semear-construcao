import Image from "next/image";
import styles from "./Hero.module.css";
import { formatBRL } from "@/lib/content";
import type { CampaignStats } from "@/lib/campaign/types";
import { TrackedLink } from "@/components/analytics/TrackedLink";

type HeroProps = {
  stats: CampaignStats;
};

/** Secao de abertura: fachada em Ken Burns, headline e indicadores da campanha. */
export function Hero({ stats }: Readonly<HeroProps>) {
  return (
    <section className={`smHeroSec ${styles.hero}`} data-ga-section="hero">
      <div className={styles.bgWrap} data-fx="hero-bg">
        <Image
          src="/images/fachada.jpg"
          alt="Fachada do novo templo da Igreja Semear"
          fill
          priority
          sizes="100vw"
          className={`smKen ${styles.bgImg}`}
        />
      </div>
      <div className={styles.overlay} />
      <div className={`smGrid ${styles.grid}`} data-fx="hero-grid" />
      <div className={`smWrap smHeroPad ${styles.content}`}>
        <div className={`smR ${styles.badge}`}>
          <span className={`smDot ${styles.dot}`} />
          <span className={styles.badgeText}>Campanha ativa · fase de estrutura</span>
        </div>
        <h1 className={styles.title} data-fx="hero-title">
          Cada tijolo
          <br />é uma semente.
        </h1>
        <p className={`smR2 ${styles.lead}`}>
          O novo templo da Igreja Semear já tem terreno e fundação prontos. Agora é a estrutura que sobe — e a
          prioridade desta primeira etapa é a cobertura, o altar e os banheiros. É isso que a sua doação
          constrói: um auditório de 1.500 lugares, salas próprias para as crianças e um espaço aberto ao bairro
          de segunda a sábado.
        </p>
        <div className={`smR3 smBtnRow ${styles.btnRow}`}>
          <TrackedLink
            href="/doar"
            ctaId="hero_doar"
            ctaLabel="Doar agora"
            ctaLocation="hero"
            className={`smLift ${styles.primaryCta}`}
            data-fx="magnetic"
          >
            Doar agora
          </TrackedLink>
          <TrackedLink
            href="#projeto"
            ctaId="hero_ver_projeto"
            ctaLabel="Ver o projeto"
            ctaLocation="hero"
            className={`smLift ${styles.secondaryCta}`}
          >
            Ver o projeto
          </TrackedLink>
        </div>
        <div className={`smR4 smHero ${styles.stats}`}>
          <div>
            <div className={styles.statHead}>
              <span className={styles.statLabel}>Arrecadado para a estrutura</span>
            </div>
            <div className={styles.statValueRow}>
              <span
                className={styles.statValue}
                data-fx="counter"
                data-fx-value={stats.arrecadado}
                data-fx-format="brl"
              >
                {formatBRL(stats.arrecadado)}
              </span>
            </div>
          </div>
          <div>
            <div className={styles.statBig} data-fx="counter" data-fx-value={stats.doadores} data-fx-format="int">
              {stats.doadores}
            </div>
            <div className={styles.statSmallLabel}>Famílias já doaram</div>
          </div>
          <div>
            <div
              className={styles.statBig}
              data-fx="counter"
              data-fx-value={stats.mensaisAtivos}
              data-fx-format="int"
            >
              {stats.mensaisAtivos}
            </div>
            <div className={styles.statSmallLabel}>Doações mensais ativas</div>
          </div>
        </div>
      </div>
    </section>
  );
}
