import styles from "./Citacao.module.css";

/** Citacao biblica que fecha o bloco de argumentacao da campanha. */
export function Citacao() {
  return (
    <section className={styles.section}>
      <div className={`smWrap ${styles.wrap}`}>
        <blockquote className={styles.blockquote}>
          <p className={`smWipe ${styles.text}`} data-fx="quote">
            &ldquo;Cada um contribua segundo propôs no seu coração, não com tristeza, nem por necessidade, porque
            Deus ama ao que dá com alegria.&rdquo;
          </p>
          <footer className={styles.footer}>
            <span className={styles.line} />
            <span className={styles.cite}>2 Coríntios 9:7</span>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
