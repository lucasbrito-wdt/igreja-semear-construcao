"use client";

import { useAutoFocus } from "../useAutoFocus";
import styles from "./Ticket.module.css";

export function TelaRecusado({
  mensagem,
  onTentarOutroCartao,
  onPagarComPix,
}: {
  mensagem: string;
  onTentarOutroCartao: () => void;
  onPagarComPix: () => void;
}) {
  const titleRef = useAutoFocus<HTMLHeadingElement>();

  return (
    <div className={styles.page} data-testid="tela-recusado">
      <div className={styles.ticket}>
        <div className={styles.statusHead}>
          <div className={`${styles.statusIcon} ${styles.warn}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="square" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </div>
          <div>
            <h2 className={styles.statusTitle} ref={titleRef} tabIndex={-1}>
              Seu banco não aprovou essa cobrança
            </h2>
          </div>
        </div>
        <p className={styles.statusBody}>{mensagem}</p>

        <div className={styles.btnRow}>
          <button type="button" className={styles.btnPrimary} onClick={onTentarOutroCartao}>
            Tentar outro cartão
          </button>
          <button type="button" className={styles.btnGhost} onClick={onPagarComPix}>
            Pagar com Pix
          </button>
        </div>
      </div>
    </div>
  );
}
