import Link from "next/link";
import styles from "./Impacto.module.css";
import { TIERS } from "@/lib/content";

/** Secao "O que cada doação vira": tiers de valor com atalho direto para o /doar. */
export function Impacto() {
  return (
    <section id="impacto" className={styles.section} data-ga-section="impacto">
      <div className={`smWrap ${styles.intro}`}>
        <div className={`smSplit ${styles.split}`}>
          <h2 className={styles.title} data-fx="section-title">
            O que cada
            <br />
            doação vira
          </h2>
          <p className={styles.subtitle}>
            Conversão real, com preços de fornecedor cotados em agosto de 2026. Clique em um valor para levá-lo
            direto ao formulário — sem taxa administrativa, 100% entra no orçamento da obra.
          </p>
        </div>
      </div>
      <div className={`smWrap ${styles.tiersWrap}`}>
        <div className={`smTiers4 ${styles.tiers}`}>
          {TIERS.map((t) => (
            <Link key={t.valor} href={t.href} className={`smLift ${styles.tier}`} data-fx="tier">
              <div className={styles.tierValor}>{t.label}</div>
              <div className={styles.tierLine} />
              <div className={styles.tierVira}>{t.vira}</div>
              <div className={styles.tierCta}>Doar este valor →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
