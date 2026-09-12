import styles from "./Contas.module.css";
import { ORCAMENTO, TRANSP, formatBRL } from "@/lib/content";
import type { CampaignStats } from "@/lib/campaign/types";
import { TransitionLink } from "@/components/fx/TransitionLink";

type ContasProps = {
  stats: CampaignStats;
};

/** Secao "Transparência sem letra miúda": principios de prestacao de contas e orcamento. */
export function Contas({ stats }: Readonly<ContasProps>) {
  return (
    <section id="contas" className={styles.section}>
      <div className={`smWrap smSplit ${styles.split}`}>
        <div>
          <h2 className={styles.title} data-fx="section-title">
            Transparência
            <br />
            sem letra miúda
          </h2>
          <div className={styles.list}>
            {TRANSP.map((i) => (
              <div key={i.n} className={styles.listItem} data-fx="reveal">
                <div className={styles.listIndex}>{i.n}</div>
                <div>
                  <div className={styles.listTitle}>{i.t}</div>
                  <p className={styles.listDesc}>{i.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className={styles.card}>
            <div className={styles.cardEyebrow}>Orçamento da estrutura</div>
            <div className={styles.budgetList}>
              {ORCAMENTO.map((o) => (
                <div key={o.item}>
                  <div className={styles.budgetRow}>
                    <span>{o.item}</span>
                    <span className={styles.budgetPct}>{o.pctTxt}</span>
                  </div>
                  <div className={styles.budgetTrack}>
                    <div className={styles.budgetFill} style={{ background: o.cor, width: o.w }} data-fx="budget-bar" />
                  </div>
                </div>
              ))}
            </div>

          </div>
          <TransitionLink href="/doar" className={`smLift ${styles.cta}`} data-fx="magnetic">
            Fazer parte da obra
          </TransitionLink>
        </div>
      </div>
    </section>
  );
}
