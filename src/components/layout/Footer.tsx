import { BrandMark } from "./BrandMark";
import styles from "./Footer.module.css";
import { CONTATOS, CULTOS, LINKS, SHOW_DEMO_NOTICE } from "@/lib/content";

const SOCIAL_LINKS = [
  {
    href: LINKS.instagram,
    label: "Instagram · @igrejasemeargba_",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.1" cy="6.9" r="1.15" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: LINKS.youtube,
    label: "YouTube · cultos ao vivo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.2" y="5" width="19.6" height="14" rx="4" />
        <path d="M10.2 9.1 15.6 12l-5.4 2.9Z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: LINKS.site,
    label: "Site oficial · igrejasemear.com.br",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.2 12h17.6" />
        <path d="M12 3c2.4 2.6 3.7 5.6 3.7 9s-1.3 6.4-3.7 9c-2.4-2.6-3.7-5.6-3.7-9S9.6 5.6 12 3Z" />
      </svg>
    ),
  },
  {
    href: LINKS.maps,
    label: "Como chegar · abre no Google Maps",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21.4s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
        <circle cx="12" cy="10.4" r="2.6" />
      </svg>
    ),
  },
];

/** Rodape compartilhado com marca, contato, horarios de culto e nota legal. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`smWrap smFoot ${styles.grid}`}>
        <div>
          <div className={styles.brandRow}>
            <BrandMark size={32} />
            <span className={styles.brandName}>Igreja Batista Semear</span>
          </div>
          <p className={styles.desc}>
            Guarabira — PB. Pastoreada pelo {CONTATOS.pastores}. Campanha de construção do novo templo, com
            prestação de contas mensal aberta a doadores e membros.
          </p>
          <div className={styles.social}>
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="smLift smIcon"
                aria-label={social.label}
                title={social.label.split(" · ")[0]}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className={styles.colTitle}>Contato</div>
          <div className={styles.colBody}>
            {CONTATOS.email}
            <br />
            {CONTATOS.telefone}
            <br />
            {CONTATOS.endereco}
            <br />
            {CONTATOS.bairro}
          </div>
        </div>
        <div>
          <div className={styles.colTitle}>Cultos</div>
          <div className={styles.colBody}>
            {CULTOS.map((culto, i) => (
              <span key={culto.dia}>
                {culto.dia} — {culto.hora}
                {i < CULTOS.length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div className={`smWrap ${styles.bottomBarInner}`}>
          Igreja Batista Semear · CNPJ {CONTATOS.cnpj}
          {SHOW_DEMO_NOTICE && " · Os valores de arrecadação exibidos são exemplos de demonstração — substitua pelos oficiais antes de publicar."}
        </div>
      </div>
    </footer>
  );
}
