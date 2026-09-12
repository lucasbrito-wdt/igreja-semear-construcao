"use client";

import { CONTATOS } from "@/lib/content";
import { useAutoFocus } from "../useAutoFocus";
import styles from "./Ticket.module.css";

export function TelaErroProvedor({
  onTentarNovamente,
}: {
  onTentarNovamente: () => void;
}) {
  const titleRef = useAutoFocus<HTMLHeadingElement>();

  return (
    <div className={styles.page} data-testid="tela-erro">
      <div className={styles.ticket}>
        <div className={styles.statusHead}>
          <div className={`${styles.statusIcon} ${styles.warn}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="square" aria-hidden="true">
              <path d="M12 8v6M12 18h.01" />
              <rect x="3" y="3" width="18" height="18" />
            </svg>
          </div>
          <div>
            <h2 className={styles.statusTitle} ref={titleRef} tabIndex={-1}>
              Não conseguimos processar seu pagamento agora
            </h2>
          </div>
        </div>
        <p className={styles.statusBody}>
          O problema foi na nossa conexão com o processador de pagamento, não nos dados que você
          enviou. Pode tentar novamente em alguns minutos — se preferir, use o Pix manual abaixo,
          sem esperar.
        </p>

        <div className={styles.btnRow}>
          <button type="button" className={styles.btnPrimary} onClick={onTentarNovamente}>
            Tentar novamente
          </button>
        </div>

        <div className={styles.pixAlt}>
          <div className={styles.t}>Prefere transferir direto?</div>
          <div className={styles.d}>
            Pix CNPJ <strong>{CONTATOS.cnpj}</strong> · Igreja Batista Semear — conta exclusiva da
            construção.
          </div>
        </div>
      </div>
    </div>
  );
}
