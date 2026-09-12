"use client";

import { useRef } from "react";

import { formatBRL } from "@/lib/content";
import { useAutoFocus, formatMinutosSegundos } from "../useAutoFocus";
import { useCopyToClipboard } from "../useCopyToClipboard";
import { usePixPolling } from "../usePixPolling";
import { usePixRevealFx } from "../fx/usePixRevealFx";
import type { DoacaoResponse } from "../types";
import styles from "./Ticket.module.css";

const TOTAL_BLOCOS = 16;

export function TelaPixAguardando({
  doacao,
  nome,
  frequenciaLabel,
  onPago,
  onGerarNovoPix,
}: {
  doacao: DoacaoResponse;
  nome: string;
  frequenciaLabel: string;
  onPago: () => void;
  onGerarNovoPix: () => void;
}) {
  const titleRef = useAutoFocus<HTMLHeadingElement>();
  const qrRef = usePixRevealFx();
  const { copiado, copiar } = useCopyToClipboard();
  const codigoRef = useRef<HTMLElement>(null);
  const pix = doacao.pix!;
  const { segundosRestantes, segundosTotais, expirado, erroConexao } = usePixPolling(
    doacao.id,
    pix.expira_em,
    onPago
  );

  const progresso = Math.max(0, Math.min(100, (segundosRestantes / segundosTotais) * 100));

  return (
    <div className={styles.page} data-testid="tela-pix">
      <div className={styles.ticket}>
        <div className={styles.statusHead}>
          <div className={`${styles.statusIcon} ${styles.wait}`}>
            <span className={`smDot ${styles.waitDot}`} aria-hidden="true" />
          </div>
          <div>
            <span className={styles.waitTag}>Aguardando pagamento</span>
            <h2 className={styles.statusTitle} ref={titleRef} tabIndex={-1} style={{ marginTop: 6 }}>
              Escaneie ou copie o código Pix
            </h2>
          </div>
        </div>

        <p role="status" aria-live="polite" className={styles.srOnly}>
          {expirado
            ? "O código Pix expirou."
            : erroConexao
              ? "Não conseguimos confirmar o status agora, tentando novamente."
              : "Aguardando a confirmação do seu banco."}
        </p>

        <div className={styles.pixGrid}>
          <div>
            <div className={styles.qrBox} ref={qrRef} data-testid="pix-qr">
              {/* eslint-disable-next-line @next/next/no-img-element -- data URI dinamica, sem otimizacao aplicavel */}
              <img
                src={`data:image/png;base64,${pix.qr_code_base64}`}
                alt="QR Code Pix para pagamento da doação"
                width={212}
                height={212}
              />
              <div className={styles.qrBlocksOverlay} aria-hidden="true">
                {Array.from({ length: TOTAL_BLOCOS }, (_, i) => (
                  <span key={i} data-fx-block className={styles.qrBlock} />
                ))}
              </div>
            </div>
            <p className={styles.qrCaption}>QR Code Pix</p>
          </div>

          <div>
            <div className={styles.copyRow}>
              <code ref={codigoRef}>{pix.copia_e_cola}</code>
              <button
                type="button"
                data-testid="pix-copiar"
                className={`${styles.copyBtn} ${copiado ? styles.copied : ""}`}
                onClick={() => copiar(pix.copia_e_cola, codigoRef.current)}
              >
                {copiado ? "Copiado" : "Copiar código"}
              </button>
            </div>

            {!expirado ? (
              <>
                <div className={styles.countRow}>
                  <span>
                    Este código expira em <strong>{formatMinutosSegundos(segundosRestantes)}</strong>
                  </span>
                  <span>{formatBRL(doacao.valor)}</span>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressBar} style={{ width: `${progresso}%` }} />
                </div>
              </>
            ) : (
              <div className={styles.expiredBox}>
                <p>Esse código Pix expirou. Gere um novo para continuar com a sua doação.</p>
                <button type="button" className={styles.btnPrimary} onClick={onGerarNovoPix}>
                  Gerar novo Pix
                </button>
              </div>
            )}

            <div className={styles.steps3}>
              <div className={styles.step}>
                <span className={styles.num}>01</span>
                <p>Abra o app do seu banco e escolha pagar com Pix, por QR Code ou &quot;Pix Copia e Cola&quot;.</p>
              </div>
              <div className={styles.step}>
                <span className={styles.num}>02</span>
                <p>
                  Confira se o valor mostrado é <strong>{formatBRL(doacao.valor)}</strong> antes de
                  confirmar o pagamento.
                </p>
              </div>
              <div className={styles.step}>
                <span className={styles.num}>03</span>
                <p>Assim que o seu banco confirmar, esta página atualiza sozinha — não é preciso recarregar.</p>
              </div>
            </div>

            <div className={styles.miniSummary}>
              <span>{frequenciaLabel}</span>
              <span>{nome}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
