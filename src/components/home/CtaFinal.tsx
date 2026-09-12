import Image from "next/image";
import styles from "./CtaFinal.module.css";
import { TrackedLink } from "@/components/analytics/TrackedLink";

/** Secao final de chamada para doacao, unica ou mensal. */
export function CtaFinal() {
  return (
    <section className={styles.section} data-ga-section="cta_final">
      <div className={styles.bgWrap} data-fx="hero-bg">
        <Image src="/images/acessos.jpg" alt="" fill sizes="100vw" className={`smKen ${styles.bgImg}`} />
      </div>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h2 className={styles.title} data-fx="section-title">
          Você pode ser parte da parede que ainda falta.
        </h2>
        <div className={`smBtnRow ${styles.btnRow}`}>
          <TrackedLink
            href="/doar"
            ctaId="cta_final_unica"
            ctaLabel="Doar uma vez"
            ctaLocation="cta_final"
            className={`smLift ${styles.primaryCta}`}
            data-fx="magnetic"
          >
            Doar uma vez
          </TrackedLink>
          <TrackedLink
            href="/doar?freq=mensal"
            ctaId="cta_final_mensal"
            ctaLabel="Doar todo mês"
            ctaLocation="cta_final"
            className={`smLift ${styles.secondaryCta}`}
            data-fx="magnetic"
          >
            Doar todo mês
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
