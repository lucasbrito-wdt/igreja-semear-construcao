"use client";

import { useRef } from "react";

import { formatBRL } from "@/lib/content";
import { useAutoFocus } from "../useAutoFocus";
import { useCopyToClipboard } from "../useCopyToClipboard";
import type { DoacaoResponse } from "../types";
import { trackBoletoCopyLine, trackBoletoOpenPdf } from "@/lib/analytics/events";
import styles from "./Ticket.module.css";

function formatDataBR(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** So permite abrir o boleto se a URL vier em https:, evitando phishing/MITM. */
function safeBoletoUrl(url: string): string | null {
  if (!URL.canParse(url)) return null;
  const parsed = new URL(url);
  return parsed.protocol === "https:" ? url : null;
}

export function TelaBoleto({ doacao }: { doacao: DoacaoResponse }) {
  const titleRef = useAutoFocus<HTMLHeadingElement>();
  const { copiado, copiar } = useCopyToClipboard();
  const linhaRef = useRef<HTMLElement>(null);
  const boleto = doacao.boleto!;
  const boletoUrl = safeBoletoUrl(boleto.url);

  return (
    <div className={styles.page} data-testid="tela-boleto">
      <div className={styles.ticket}>
        <div className={styles.statusHead}>
          <div className={`${styles.statusIcon} ${styles.wait}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="square" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" />
              <path d="M8 9h8M8 13h5" />
            </svg>
          </div>
          <div>
            <span className={styles.waitTag} style={{ color: "var(--mute)" }}>
              Aguardando compensação
            </span>
            <h2 className={styles.statusTitle} ref={titleRef} tabIndex={-1} style={{ marginTop: 6 }}>
              Seu boleto foi gerado
            </h2>
          </div>
        </div>
        <p className={styles.statusBody}>
          Pague em qualquer banco, app ou casa lotérica até o vencimento. Assim que o pagamento
          compensar, seu comprovante chega por e-mail automaticamente.
        </p>

        <div className={styles.digitLine}>
          <code ref={linhaRef}>{boleto.linha_digitavel}</code>
          <button
            type="button"
            className={`${styles.copyBtn} ${copiado ? styles.copied : ""}`}
            onClick={() => {
              copiar(boleto.linha_digitavel, linhaRef.current);
              trackBoletoCopyLine(doacao.valor);
            }}
          >
            {copiado ? "Copiado" : "Copiar linha"}
          </button>
        </div>

        {boletoUrl && (
          <div className={styles.btnRow}>
            <a
              href={boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnPrimary}
              onClick={() => trackBoletoOpenPdf(doacao.valor)}
            >
              Abrir boleto (PDF)
            </a>
          </div>
        )}

        <div className={styles.boletoMeta}>
          <div>
            <span className={styles.k}>Vencimento</span>
            <span className={styles.v}>{formatDataBR(boleto.vencimento)}</span>
          </div>
          <div>
            <span className={styles.k}>Valor</span>
            <span className={styles.v}>{formatBRL(doacao.valor)}</span>
          </div>
          <div>
            <span className={styles.k}>Favorecido</span>
            <span className={styles.v}>Igreja Batista Semear</span>
          </div>
        </div>

        <div className={styles.noteBox}>
          A compensação do boleto pode levar até 3 dias úteis depois do pagamento. Você recebe a
          confirmação por e-mail assim que ela acontecer — não é preciso reenviar o comprovante.
        </div>
      </div>
    </div>
  );
}
