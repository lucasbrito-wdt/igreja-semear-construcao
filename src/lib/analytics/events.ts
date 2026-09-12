/**
 * Camada central de analytics do site. Todo evento do GA4 passa por `track`,
 * que nunca lanca e faz no-op no servidor ou sem NEXT_PUBLIC_GA_ID configurado.
 * Os helpers abaixo sao tipados por evento — ver a taxonomia completa na
 * tarefa de instrumentacao (nomes e params sao literais, nao inventar sinonimos).
 *
 * Nunca envie PII (nome, email, telefone, CPF/CNPJ, CEP, dados de cartao) em
 * nenhum param — use apenas os campos ja pensados para isso (ex.: valor_faixa
 * em vez do valor exato mapeado por doador, nomes de campo em vez de valores).
 */

import { sendGAEvent } from "@next/third-parties/google";
import type { Frequencia, MetodoPagamento } from "@/components/doar/types";

const ITEM_DOACAO = {
  item_id: "campanha-terreno",
  item_name: "Doação para Construção",
  item_category: "doacao",
};

/** Wrapper seguro sobre sendGAEvent: no-op no servidor, sem GA_ID, ou se o GA falhar. */
export function track(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  try {
    sendGAEvent("event", name, params);
  } catch {
    // GA bloqueado/indisponivel — nunca deve quebrar a UI
  }
}

/** Buckets de valor para o param valor_faixa, evitando expor o valor exato em dimensoes livres. */
export function faixaDeValor(valor: number): string {
  if (valor <= 50) return "0-50";
  if (valor <= 100) return "51-100";
  if (valor <= 250) return "101-250";
  if (valor <= 500) return "251-500";
  if (valor <= 1000) return "501-1000";
  return "1000+";
}

// ---------------------------------------------------------------------------
// Home / navegacao
// ---------------------------------------------------------------------------

export function trackViewItem(): void {
  track("view_item", { currency: "BRL", items: [ITEM_DOACAO] });
}

export function trackSelectCta(params: {
  cta_id: string;
  cta_label: string;
  cta_location: string;
  link_destino: string;
}): void {
  track("select_cta", params);
}

export function trackViewSection(sectionId: string): void {
  track("view_section", { section_id: sectionId });
}

export function trackClickSocial(params: {
  network: "instagram" | "youtube" | "site" | "maps";
  link_destino: string;
}): void {
  track("click_social", params);
}

// ---------------------------------------------------------------------------
// Funil /doar
// ---------------------------------------------------------------------------

export function trackBeginCheckout(frequencia: Frequencia): void {
  track("begin_checkout", { currency: "BRL", frequencia, items: [ITEM_DOACAO] });
}

export function trackSelectFrequencia(frequencia: Frequencia): void {
  track("select_frequencia", { frequencia });
}

export function trackSelectValor(params: { value: number; origem_valor: "preset" | "outro" }): void {
  track("select_valor", {
    value: params.value,
    valor_faixa: faixaDeValor(params.value),
    origem_valor: params.origem_valor,
    currency: "BRL",
  });
}

export function trackSelectPaymentMethod(params: { payment_type: MetodoPagamento; frequencia: Frequencia }): void {
  track("select_payment_method", params);
}

export function trackFormError(params: {
  total_erros: number;
  campos_erro: string;
  etapa: "submit" | "api";
}): void {
  track("form_error", params);
}

export function trackAddPaymentInfo(params: { value: number; payment_type: MetodoPagamento; frequencia: Frequencia }): void {
  track("add_payment_info", {
    currency: "BRL",
    value: params.value,
    payment_type: params.payment_type,
    frequencia: params.frequencia,
    valor_faixa: faixaDeValor(params.value),
    items: [ITEM_DOACAO],
  });
}

export function trackGenerateLead(params: {
  transaction_id: string;
  value: number;
  payment_type: MetodoPagamento;
  frequencia: Frequencia;
}): void {
  track("generate_lead", {
    transaction_id: params.transaction_id,
    currency: "BRL",
    value: params.value,
    payment_type: params.payment_type,
    frequencia: params.frequencia,
    valor_faixa: faixaDeValor(params.value),
    items: [ITEM_DOACAO],
  });
}

export function trackPurchase(params: {
  transaction_id: string;
  value: number;
  payment_type: MetodoPagamento;
  frequencia: Frequencia;
}): void {
  track("purchase", {
    transaction_id: params.transaction_id,
    currency: "BRL",
    value: params.value,
    payment_type: params.payment_type,
    frequencia: params.frequencia,
    valor_faixa: faixaDeValor(params.value),
    items: [ITEM_DOACAO],
  });
}

export function trackPaymentRefused(params: { payment_type: MetodoPagamento; valor: number; motivo: string }): void {
  track("payment_refused", {
    payment_type: params.payment_type,
    valor_faixa: faixaDeValor(params.valor),
    motivo: params.motivo,
  });
}

export function trackPaymentProviderError(params: { payment_type: MetodoPagamento }): void {
  track("payment_provider_error", params);
}

export function trackPaymentBlocked(params: {
  payment_type: MetodoPagamento;
  bloqueio_tipo: "acesso-negado" | "limite";
}): void {
  track("payment_blocked", params);
}

export function trackPixCopyCode(valor: number): void {
  track("pix_copy_code", { valor_faixa: faixaDeValor(valor) });
}

export function trackPixExpired(valor: number): void {
  track("pix_expired", { valor_faixa: faixaDeValor(valor) });
}

export function trackPixNewRequested(): void {
  track("pix_new_requested");
}

export function trackPixPollingError(): void {
  track("pix_polling_error");
}

export function trackBoletoCopyLine(valor: number): void {
  track("boleto_copy_line", { valor_faixa: faixaDeValor(valor) });
}

export function trackBoletoOpenPdf(valor: number): void {
  track("boleto_open_pdf", { valor_faixa: faixaDeValor(valor) });
}

export function trackThanksNewDonation(): void {
  track("thanks_new_donation");
}

export function trackThanksBackCampaign(): void {
  track("thanks_back_campaign");
}

export function trackRetryOtherCard(): void {
  track("retry_other_card");
}

export function trackRetryWithPix(): void {
  track("retry_with_pix");
}

// ---------------------------------------------------------------------------
// Portal do doador
// ---------------------------------------------------------------------------

export function trackDoadorPortalView(pagina: "home" | "auth" | "painel"): void {
  track("doador_portal_view", { pagina });
}

export function trackDoadorLoginSubmit(): void {
  track("doador_login_submit");
}

export function trackDoadorLoginSuccess(): void {
  track("doador_login_success");
}

export function trackDoadorLoginError(erroTipo: string): void {
  track("doador_login_error", { erro_tipo: erroTipo });
}
