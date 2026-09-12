/**
 * Tipos da resposta da API (POST /campanhas/{slug}/doacoes e status),
 * espelhando docs/spec-delta.md secao "Contrato da API Laravel".
 */

export type MetodoPagamento = "pix" | "boleto" | "cartao";
export type Frequencia = "unica" | "mensal";

export type DoacaoPixInfo = {
  qr_code_base64: string;
  copia_e_cola: string;
  expira_em: string;
};

export type DoacaoBoletoInfo = {
  url: string;
  linha_digitavel: string;
  vencimento: string;
};

export type DoacaoCartaoInfo = {
  aprovado: true;
  final: string;
  bandeira: string;
};

export type DoacaoResponse = {
  id: string;
  status: "pendente" | "pago" | "falha" | "cancelada";
  frequencia: Frequencia;
  metodo: MetodoPagamento;
  valor: number;
  pix?: DoacaoPixInfo;
  boleto?: DoacaoBoletoInfo;
  cartao?: DoacaoCartaoInfo;
  proxima_cobranca?: string;
};

export type DoacaoStatusResponse = {
  id: string;
  status: string;
  pago: boolean;
};

export type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

/** Estados explicitos da maquina de estados do fluxo de doacao. */
export type FlowStep =
  | "form"
  | "enviando"
  | "pix-aguardando"
  | "boleto"
  | "cartao-aprovado"
  | "recusado"
  | "erro-provedor"
  | "pago";

/** Contexto carregado junto ao step, usado pelas telas pos-envio. */
export type FlowContext = {
  doacao: DoacaoResponse | null;
  nome: string;
  email: string;
  mensagem: string | null;
};
