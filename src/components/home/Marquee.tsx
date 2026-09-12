import styles from "./Marquee.module.css";
import { TICKER } from "@/lib/content";

/** Faixa continua com destaques da campanha, duplicada para looping sem costura. */
export function Marquee() {
  return (
    <section className={styles.section}>
      <div className={`smMarquee ${styles.track}`} data-fx="marquee">
        {[0, 1].map((pass) =>
          TICKER.map((t, i) => (
            <span key={`${pass}-${i}`} className={styles.item}>
              {t.txt}
              <span className={styles.dot} />
            </span>
          )),
        )}
      </div>
    </section>
  );
}
