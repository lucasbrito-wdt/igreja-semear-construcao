import { BrandMark } from "./BrandMark";
import { TransitionLink } from "@/components/fx/TransitionLink";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { href: "#porque", label: "Por que" },
  { href: "#projeto", label: "O projeto" },
  { href: "#etapas", label: "Etapas" },
  { href: "#impacto", label: "Sua doação" },
  { href: "#contas", label: "Transparência" },
  { href: "#visite", label: "Visite" },
] as const;

/** Cabecalho fixo com marca, navegacao por ancoras e CTA de doacao. */
export function Header() {
  return (
    <header className={styles.header} data-fx-header>
      <div className={`smWrap smHeadRow ${styles.row}`}>
        <TransitionLink href="/" aria-label="Voltar ao início da campanha" className={styles.brand}>
          <BrandMark size={34} />
          <span className={styles.brandText}>
            <span className={`smBrandName ${styles.brandName}`}>Igreja Semear</span>
            <span className={`smBrandSub ${styles.brandSub}`}>Guarabira · PB</span>
          </span>
        </TransitionLink>
        <nav className={`smNav ${styles.nav}`}>
          {NAV_ITEMS.map((item) => (
            <a key={item.href} className="smUl" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <TrackedLink
            href="/doador"
            ctaId="header_portal"
            ctaLabel="Portal do Doador"
            ctaLocation="header"
            className="smUl"
            style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}
          >
            Portal do Doador
          </TrackedLink>
          <TrackedLink
            href="/doar"
            ctaId="header_doar"
            ctaLabel="Quero doar"
            ctaLocation="header"
            className={`smLift smCta ${styles.cta}`}
            data-fx="magnetic"
          >
            Quero doar
          </TrackedLink>
        </div>
      </div>
      <div className={styles.progress} data-fx="reading-progress" />
    </header>
  );
}
