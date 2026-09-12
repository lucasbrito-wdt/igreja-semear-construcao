"use client";

import { useEffect, useMemo, useState } from "react";

import type { DoacaoStatusResponse } from "./types";

const INTERVALO_INICIAL_MS = 4000;
const INTERVALO_MAX_MS = 30000;
/** Teto absoluto de duracao do polling, mesmo com `expira_em` valido e distante. */
const TETO_DURACAO_MS = 60 * 60_000;
/** Teto absoluto de consultas, independente do tempo decorrido. */
const TETO_TENTATIVAS = 400;

type UsePixPollingResult = {
  /** Segundos restantes ate a expiracao do Pix (nunca negativo). */
  segundosRestantes: number;
  /** Segundos totais capturados no primeiro efeito — usado para a barra de progresso. */
  segundosTotais: number;
  expirado: boolean;
  erroConexao: boolean;
};

const ISO_COM_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;
const SEM_OFFSET = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;

/**
 * Converte `expira_em` para epoch ms de forma robusta e independente de
 * engine. Nunca usa `new Date(string)`/`Date.parse` num formato ambiguo:
 * - ISO 8601 com offset ou "Z" explicito: inequivoco em qualquer engine,
 *   `Date.parse` resolve direto.
 * - Formato do Asaas "YYYY-MM-DD HH:mm:ss" (sem timezone): tratado como
 *   America/Sao_Paulo, UTC-3 fixo (sem horario de verao desde 2019).
 * Qualquer outro formato retorna `null` (o chamador aplica o teto de 60min).
 */
function parseExpiraEm(expiraEm: string): number | null {
  const valor = expiraEm.trim();

  if (ISO_COM_OFFSET.test(valor)) {
    const ms = Date.parse(valor);
    return Number.isFinite(ms) ? ms : null;
  }

  const semOffset = SEM_OFFSET.exec(valor);
  if (semOffset) {
    const [, ano, mes, dia, hora, minuto, segundo] = semOffset;
    const ms = Date.UTC(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      Number(hora) + 3,
      Number(minuto),
      Number(segundo)
    );
    return Number.isFinite(ms) ? ms : null;
  }

  return null;
}

function calcularRestante(expiraEmMs: number): number {
  return Math.max(0, Math.round((expiraEmMs - Date.now()) / 1000));
}

/**
 * Faz polling de GET /api/doacoes/{id}/status a cada 4s, pausando quando a
 * aba fica oculta, dobrando o intervalo (ate 30s) em erro, e parando ao
 * expirar o Pix, ao atingir o teto de duracao/tentativas, ou ao chamar
 * onPago. A leitura do relogio fica dentro de efeitos (nunca no corpo do
 * hook) para manter o render puro.
 */
export function usePixPolling(
  doacaoId: string,
  expiraEm: string,
  onPago: () => void
): UsePixPollingResult {
  const [inicioMs] = useState(() => Date.now());
  const tetoAbsolutoMs = inicioMs + TETO_DURACAO_MS;
  const expiraEmMs = useMemo(() => {
    const parsed = parseExpiraEm(expiraEm);
    return Math.min(parsed ?? tetoAbsolutoMs, tetoAbsolutoMs);
  }, [expiraEm, tetoAbsolutoMs]);

  const [segundosRestantes, setSegundosRestantes] = useState(() => calcularRestante(expiraEmMs));
  const [segundosTotais] = useState(() => Math.max(1, calcularRestante(expiraEmMs)));
  const [erroConexao, setErroConexao] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const expirado = segundosRestantes <= 0 || tentativas >= TETO_TENTATIVAS;

  // contagem regressiva
  useEffect(() => {
    const tick = setInterval(() => {
      setSegundosRestantes(calcularRestante(expiraEmMs));
    }, 1000);
    return () => clearInterval(tick);
  }, [expiraEmMs]);

  // polling de status
  useEffect(() => {
    if (expirado) return;

    let cancelado = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let backoffMs = INTERVALO_INICIAL_MS;
    let escondidoNaUltimaChecagem = false;

    async function consultarStatus() {
      if (cancelado) return;
      if (document.visibilityState === "hidden") {
        escondidoNaUltimaChecagem = true;
        return;
      }
      escondidoNaUltimaChecagem = false;
      setTentativas((n) => n + 1);

      try {
        const response = await fetch(`/api/doacoes/${doacaoId}/status`, { cache: "no-store" });
        if (!response.ok) throw new Error("status-falhou");
        const body = (await response.json()) as DoacaoStatusResponse;

        if (cancelado) return;
        setErroConexao(false);
        backoffMs = INTERVALO_INICIAL_MS;

        if (body.pago) {
          onPago();
          return;
        }
      } catch {
        if (cancelado) return;
        setErroConexao(true);
        backoffMs = Math.min(backoffMs * 2, INTERVALO_MAX_MS);
      }

      agendarProxima();
    }

    function agendarProxima() {
      if (cancelado) return;
      timeoutId = setTimeout(consultarStatus, backoffMs);
    }

    function aoMudarVisibilidade() {
      if (document.visibilityState === "visible" && escondidoNaUltimaChecagem) {
        void consultarStatus();
      }
    }

    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    agendarProxima();

    return () => {
      cancelado = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [doacaoId, expirado, onPago]);

  return { segundosRestantes, segundosTotais, expirado, erroConexao };
}
