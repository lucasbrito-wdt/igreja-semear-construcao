"use client";

import { formatBRL } from "@/lib/content";
import type { CampaignStats } from "@/lib/campaign/types";
import { useAutoFocus } from "../useAutoFocus";
import { useSementesFx } from "../fx/useSementesFx";
import type { DoacaoResponse } from "../types";
import styles from "./Ticket.module.css";

const METODO_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  boleto: "Boleto",
};

function formatDataBR(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function primeiroNomeDe(nome: string): string {
  return nome.trim().split(/\s+/)[0] || "amigo";
}

export function TelaObrigado({
  doacao,
  nome,
  email,
  campaignStats,
  onVoltarCampanha,
  onNovaDoacao,
}: {
  doacao: DoacaoResponse;
  nome: string;
  email: string;
  campaignStats: CampaignStats;
  onVoltarCampanha: () => void;
  onNovaDoacao: () => void;
}) {
  const titleRef = useAutoFocus<HTMLHeadingElement>();
  const { canvasRef, checkRef } = useSementesFx(true);

  const primeiroNome = primeiroNomeDe(nome);
  const sufixo = doacao.frequencia === "mensal" ? "/mês" : " única";
  const valorFmt = formatBRL(doacao.valor);
  const assinaturaMensal = doacao.frequencia === "mensal";
  const cartaoMensalAprovado = doacao.metodo === "cartao" && assinaturaMensal && doacao.cartao;

  const titulo = cartaoMensalAprovado ? `Assinatura confirmada, ${primeiroNome}.` : `Obrigado, ${primeiroNome}.`;

  const corpo = cartaoMensalAprovado
    ? `Seu cartão foi aprovado e a primeira cobrança de ${valorFmt} já foi feita. A próxima cobrança acontece em ${
        doacao.proxima_cobranca ? formatDataBR(doacao.proxima_cobranca) : "um mês"
      }, sempre no mesmo dia, direto no cartão cadastrado.`
    : `Sua doação de ${valorFmt}${sufixo} foi confirmada. O comprovante já foi enviado para ${
        email || "seu e-mail"
      } e, a partir do próximo mês, você recebe o relatório com as fotos do andamento da obra.`;

  return (
    <div className={styles.page} data-testid="tela-obrigado">
      <div className={styles.ticket}>
        <div className={styles.checkWrap}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path ref={checkRef} d="M4 12.5 9.5 18 20 6" />
          </svg>
        </div>
        <h2 className={styles.statusTitle} ref={titleRef} tabIndex={-1} style={{ fontSize: "clamp(30px,4.4vw,50px)" }}>
          {titulo}
        </h2>
        <p className={styles.statusBody}>{corpo}</p>

        {assinaturaMensal && (
          <span className={styles.subBadge}>
            <span className={styles.sw} />
            Assinatura ativa
          </span>
        )}

        <div className={styles.btnRow}>
          <button type="button" className={styles.btnPrimary} onClick={onVoltarCampanha}>
            Voltar à campanha
          </button>
          <button type="button" className={styles.btnGhost} onClick={onNovaDoacao}>
            Fazer outra doação
          </button>
        </div>

        <div className={styles.doneGrid}>
          <div>
            <div className={styles.obraArt}>
              <canvas ref={canvasRef} className={styles.sementesCanvas} aria-hidden="true" />
            </div>
            <div className={styles.metaCard}>
              <div className={styles.lbl}>Meta atualizada</div>
              <div className={styles.txt}>
                {formatBRL(campaignStats.arrecadado)} de {formatBRL(campaignStats.meta)} —{" "}
                {campaignStats.pct}% do orçamento da estrutura.
              </div>
            </div>
          </div>
          <div>
            <p className={styles.statusBody} style={{ marginTop: 0 }}>
              Toda contribuição fica registrada com o recibo disponível por e-mail a qualquer
              momento.
            </p>
            <div className={styles.cardSummary}>
              <div className={styles.r}>
                <span>Pagamento</span>
                <span>{METODO_LABEL[doacao.metodo]}</span>
              </div>
              {cartaoMensalAprovado && doacao.cartao && (
                <div className={styles.r}>
                  <span>Cartão</span>
                  <span>
                    {doacao.cartao.bandeira} •••• {doacao.cartao.final}
                  </span>
                </div>
              )}
              {doacao.proxima_cobranca && (
                <div className={styles.r}>
                  <span>Próxima cobrança</span>
                  <span>{formatDataBR(doacao.proxima_cobranca)}</span>
                </div>
              )}
              <div className={styles.r}>
                <span>Código da doação</span>
                <span>{doacao.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
