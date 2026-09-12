import styles from "./Etapas.module.css";
import { ETAPAS, ETAPAS_ATUALIZACAO } from "@/lib/content";

/** Secao "Onde a obra está hoje": linha do tempo com o andamento de cada etapa. */
export function Etapas() {
  return (
    <section id="etapas" className={styles.section}>
      <div className={`smWrap ${styles.wrap}`}>
        <div className={styles.headRow}>
          <h2 className={styles.title} data-fx="section-title">
            Onde a obra está hoje
          </h2>
          <span className={styles.updated}>{ETAPAS_ATUALIZACAO}</span>
        </div>
        <div className={`smSteps5 ${styles.track}`} data-fx="etapas-track">
          {ETAPAS.map((e) => (
            <div key={e.nome} className={styles.step}>
              <div className={styles.bar} style={{ background: e.barBg }} />
              <div className={styles.status} style={{ color: e.toneColor }}>
                {e.status}
              </div>
              <div className={styles.nome}>{e.nome}</div>
              <div className={styles.prazo}>{e.prazo}</div>
              <p className={styles.desc}>{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
