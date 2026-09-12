import styles from "./Visite.module.css";
import { CONTATOS, CULTOS, LINKS } from "@/lib/content";

const EXTERNAL_LINKS = [
  { href: LINKS.maps, label: "Ver no Google Maps" },
  { href: LINKS.instagram, label: "Instagram @igrejasemeargba_" },
  { href: LINKS.youtube, label: "YouTube — cultos ao vivo" },
  { href: LINKS.site, label: "igrejasemear.com.br" },
];

/** Secao "Nossos cultos": horarios, endereco e links externos da igreja. */
export function Visite() {
  return (
    <section id="visite" className={styles.section} data-ga-section="visite">
      <div className={`smWrap smSplit ${styles.split}`}>
        <div>
          <div className={styles.eyebrowRow}>
            <span className={styles.eyebrowLine} data-fx="filete" />
            <span className={styles.eyebrowText}>Venha nos visitar</span>
          </div>
          <h2 className={styles.title} data-fx="section-title">
            Nossos cultos
          </h2>
          <div className={styles.schedule}>
            {CULTOS.map((c) => (
              <div key={c.dia} className={styles.scheduleRow}>
                <span className={styles.scheduleDay}>{c.dia}</span>
                <span className={styles.scheduleLine} />
                <span className={styles.scheduleHour}>{c.hora}</span>
              </div>
            ))}
          </div>
          <p className={styles.pastors}>
            Pastoreada pelo {CONTATOS.pastores}. Se for a sua primeira vez, procure alguém da equipe de recepção
            na entrada — vamos te acompanhar.
          </p>
        </div>
        <div>
          <div className={styles.card}>
            <div className={styles.cardEyebrow}>Onde estamos</div>
            <div className={styles.address}>
              {CONTATOS.endereco}
              <br />
              {CONTATOS.bairro}
            </div>
            <div className={styles.contact}>
              {CONTATOS.email}
              <br />
              {CONTATOS.telefone}
            </div>
            <div className={`smLinkRow ${styles.linkRow}`}>
              {EXTERNAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`smLift ${styles.link}`}
                >
                  {link.label}
                  <span>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
