"use client";

import { useRef, useState } from "react";

import type { ApiPayload, DonationErrors } from "@/lib/validation/donation";
import { mapApiErrors } from "./errorMapping";
import type { ApiErrorBody, DoacaoResponse } from "./types";

export type SubmitOutcome =
  | { kind: "sucesso"; doacao: DoacaoResponse }
  | { kind: "validacao"; errors: DonationErrors }
  | { kind: "recusado"; message: string }
  | { kind: "acesso-negado"; message: string }
  | { kind: "limite"; message: string }
  | { kind: "erro-provedor"; message: string };

const MENSAGEM_RECUSADO =
  "Seu banco não aprovou essa cobrança. Você pode tentar de novo com o mesmo cartão, usar outro, ou pagar por Pix agora mesmo.";
const MENSAGEM_ACESSO_NEGADO = "Não conseguimos validar seu acesso. Recarregue a página e tente de novo.";
const MENSAGEM_LIMITE = "Muitas tentativas. Aguarde um minuto.";
const MENSAGEM_PROVEDOR = "Não conseguimos processar seu pagamento agora. Tente novamente em instantes.";

async function parseBody(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Idempotency key por tentativa de envio (nunca persistida em storage).
 * Reaproveitada somente quando o reenvio repete exatamente o mesmo payload
 * apos uma falha de rede/gateway (erro-provedor); qualquer outro desfecho, ou
 * qualquer alteracao de campo, gera uma chave nova.
 */
function useIdempotencyKey() {
  const ultimaTentativa = useRef<{ chave: string; payloadJson: string } | null>(null);

  function obterChave(payloadJson: string): string {
    if (ultimaTentativa.current?.payloadJson === payloadJson) {
      return ultimaTentativa.current.chave;
    }
    return crypto.randomUUID();
  }

  function manterParaRetentativa(chave: string, payloadJson: string) {
    ultimaTentativa.current = { chave, payloadJson };
  }

  function invalidar() {
    ultimaTentativa.current = null;
  }

  return { obterChave, manterParaRetentativa, invalidar };
}

/** Envia o payload da doacao para /api/doacoes e classifica a resposta. */
export function useSubmitDonation() {
  const [submitting, setSubmitting] = useState(false);
  const idempotencia = useIdempotencyKey();

  async function enviar(payload: ApiPayload): Promise<SubmitOutcome> {
    setSubmitting(true);
    const payloadJson = JSON.stringify(payload);
    const idempotencyKey = idempotencia.obterChave(payloadJson);

    try {
      const response = await fetch("/api/doacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: payloadJson,
      });
      const body = await parseBody(response);

      if (response.status === 201) {
        idempotencia.invalidar();
        return { kind: "sucesso", doacao: body as unknown as DoacaoResponse };
      }
      if (response.status === 422) {
        idempotencia.invalidar();
        const errBody = body as ApiErrorBody;
        return { kind: "validacao", errors: mapApiErrors(errBody.errors ?? {}) };
      }
      if (response.status === 402) {
        idempotencia.invalidar();
        return { kind: "recusado", message: (body as ApiErrorBody).message ?? MENSAGEM_RECUSADO };
      }
      if (response.status === 403) {
        idempotencia.invalidar();
        return { kind: "acesso-negado", message: MENSAGEM_ACESSO_NEGADO };
      }
      if (response.status === 429) {
        idempotencia.invalidar();
        return { kind: "limite", message: MENSAGEM_LIMITE };
      }
      // 5xx/502/timeout: mantem a chave para a proxima tentativa com o mesmo payload.
      idempotencia.manterParaRetentativa(idempotencyKey, payloadJson);
      return { kind: "erro-provedor", message: (body as ApiErrorBody).message ?? MENSAGEM_PROVEDOR };
    } catch {
      idempotencia.manterParaRetentativa(idempotencyKey, payloadJson);
      return { kind: "erro-provedor", message: MENSAGEM_PROVEDOR };
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, enviar };
}
