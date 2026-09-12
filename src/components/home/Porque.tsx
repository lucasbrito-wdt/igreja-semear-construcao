import styles from "./Porque.module.css";
import { MOTIVOS } from "@/lib/content";

/** Secao "Por que construir": justificativa e os tres motivos principais. */
export function Porque() {
  return (
    <section id="porque" className={styles.section}>
      <div className={`smWrap ${styles.intro}`}>
        <div className={`smSplit ${styles.split}`}>
          <div>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowLine} data-fx="filete" />
              <span className={styles.eyebrowText}>Por que construir</span>
            </div>
            <h2 className={styles.title} data-fx="section-title">
              A igreja cresceu.
              <br />O prédio, não.
            </h2>
          </div>
          <div className={`smSplitBody ${styles.body}`}>
            <p className={styles.bodyText} data-fx="reveal">
              Nos domingos, realizamos dois cultos e ainda faltam cadeiras. As crianças se dividem em salas
              improvisadas atrás do palco, e os projetos com o bairro dependem de emprestar espaço de terceiros. O
              novo templo não é um prédio maior por vaidade: é a estrutura que permite receber quem chega e
              devolver algo à cidade durante a semana.
            </p>
          </div>
        </div>
      </div>
      <div className={`smWrap smCards3 ${styles.cards}`}>
        {MOTIVOS.map((m) => (
          <div key={m.n} className={`smLift ${styles.card}`} data-fx="reveal">
            <div className={styles.cardHead}>
              <span className={styles.cardIndex}>{m.n}</span>
              <span className={styles.cardIcon}>{m.ic}</span>
            </div>
            <div className={styles.cardTitle}>{m.t}</div>
            <p className={styles.cardDesc}>{m.d}</p>
            <div className={styles.cardDado}>{m.dado}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
