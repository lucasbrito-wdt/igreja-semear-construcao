import Image from "next/image";
import styles from "./CtaFinal.module.css";
import { TransitionLink } from "@/components/fx/TransitionLink";

/** Secao final de chamada para doacao, unica ou mensal. */
export function CtaFinal() {
  return (
    <section className={styles.section}>
      <div className={styles.bgWrap} data-fx="hero-bg">
        <Image src="/images/acessos.jpg" alt="" fill sizes="100vw" className={`smKen ${styles.bgImg}`} />
      </div>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h2 className={styles.title} data-fx="section-title">
          Você pode ser parte da parede que ainda falta.
        </h2>
        <div className={`smBtnRow ${styles.btnRow}`}>
          <TransitionLink href="/doar" className={`smLift ${styles.primaryCta}`} data-fx="magnetic">
            Doar uma vez
          </TransitionLink>
          <TransitionLink href="/doar?freq=mensal" className={`smLift ${styles.secondaryCta}`} data-fx="magnetic">
            Doar todo mês
          </TransitionLink>
        </div>
      </div>
    </section>
  );
}
