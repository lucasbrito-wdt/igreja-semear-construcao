"use client";

import { useMemo, useState } from "react";

import { formatCpfCnpj } from "@/lib/validation/documents";
import { detectBrand, type CardBrand } from "@/lib/validation/card";
import { validateDonation, type DonationErrors, type DonationForm } from "@/lib/validation/donation";
import { formatBRL, getImpacto, VALORES } from "@/lib/content";
import type { Frequencia, MetodoPagamento } from "./types";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Mascara progressiva de telefone BR: (DD) DDDDD-DDDD ou (DD) DDDD-DDDD. */
function formatTelefone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (digits.length <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

/** Extrai so digitos de um valor "outro valor" digitado livremente. */
function parseValorLivre(texto: string): number {
  const digits = texto.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export type CartaoState = { titular: string; numero: string; mes: string; ano: string; cvv: string };
export type EnderecoState = { cep: string; numero: string };

const CARTAO_VAZIO: CartaoState = { titular: "", numero: "", mes: "", ano: "", cvv: "" };
const ENDERECO_VAZIO: EnderecoState = { cep: "", numero: "" };

/** Estado e derivacoes do formulario de doacao — sem I/O, so estado local. */
export function useDonationForm(frequenciaInicial: Frequencia, valorInicial: number | null) {
  const presetInicial = VALORES.find((v) => v.valor === valorInicial)?.valor ?? null;
  const outroInicial = valorInicial !== null && presetInicial === null ? String(valorInicial) : "";

  const [frequencia, setFrequencia] = useState<Frequencia>(frequenciaInicial);
  const [valorSelecionado, setValorSelecionado] = useState<number | null>(presetInicial);
  const [outroValorInput, setOutroValorInput] = useState(outroInicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefoneInput, setTelefoneInput] = useState("");
  const [cpfCnpjInput, setCpfCnpjInput] = useState("");
  // LGPD art. 8º: opt-in explicito, nunca pre-marcado.
  const [recibo, setRecibo] = useState(false);
  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");
  const [cartao, setCartao] = useState<CartaoState>(CARTAO_VAZIO);
  const [endereco, setEndereco] = useState<EnderecoState>(ENDERECO_VAZIO);
  const [errors, setErrors] = useState<DonationErrors>({});

  const valor = useMemo(() => {
    if (valorSelecionado !== null) return valorSelecionado;
    return parseValorLivre(outroValorInput) || (valorInicial ?? 0);
  }, [valorSelecionado, outroValorInput, valorInicial]);

  const brand: CardBrand = useMemo(() => detectBrand(cartao.numero), [cartao.numero]);
  const impacto = useMemo(() => getImpacto(valor), [valor]);
  const valorFormatado = useMemo(() => formatBRL(valor), [valor]);

  function selecionarValor(v: number) {
    setValorSelecionado(v);
    setOutroValorInput("");
    setErrors((prev) => ({ ...prev, valor: undefined }));
  }

  function alterarOutroValor(texto: string) {
    setOutroValorInput(texto);
    setValorSelecionado(null);
    setErrors((prev) => ({ ...prev, valor: undefined }));
  }

  function alterarTelefone(texto: string) {
    setTelefoneInput(formatTelefone(texto));
    setErrors((prev) => ({ ...prev, telefone: undefined }));
  }

  function alterarCpfCnpj(texto: string) {
    setCpfCnpjInput(formatCpfCnpj(texto));
    setErrors((prev) => ({ ...prev, cpfCnpj: undefined }));
  }

  function alterarCartaoCampo(campo: keyof CartaoState, valorCampo: string) {
    setCartao((prev) => ({ ...prev, [campo]: valorCampo }));
    const errorKey = `cartao.${campo === "mes" || campo === "ano" ? "validade" : campo}` as keyof DonationErrors;
    setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
  }

  function alterarEnderecoCampo(campo: keyof EnderecoState, valorCampo: string) {
    setEndereco((prev) => ({ ...prev, [campo]: valorCampo }));
    const errorKey = `endereco.${campo}` as keyof DonationErrors;
    setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
  }

  function limparCartaoSensivel() {
    setCartao((prev) => ({ ...prev, numero: "", cvv: "" }));
  }

  function resetarParaMetodo(novoMetodo: MetodoPagamento) {
    setMetodo(novoMetodo);
    setCartao(CARTAO_VAZIO);
    setEndereco(ENDERECO_VAZIO);
    setErrors({});
  }

  /** Limpa todo o formulario — usado em "Fazer outra doação" apos a confirmação. */
  function resetarTudo() {
    setFrequencia("unica");
    setValorSelecionado(null);
    setOutroValorInput("");
    setNome("");
    setEmail("");
    setTelefoneInput("");
    setCpfCnpjInput("");
    setRecibo(false);
    setMetodo("pix");
    setCartao(CARTAO_VAZIO);
    setEndereco(ENDERECO_VAZIO);
    setErrors({});
  }

  function montarDonationForm(): DonationForm {
    return {
      frequencia,
      metodo,
      valor,
      nome,
      email,
      cpfCnpj: cpfCnpjInput,
      telefone: telefoneInput,
      recibo,
      ...(metodo === "cartao" ? { cartao, endereco } : {}),
    };
  }

  function validar(): { ok: boolean; errors: DonationErrors } {
    const resultado = validateDonation(montarDonationForm());
    if (!resultado.ok) {
      setErrors(resultado.errors);
      return { ok: false, errors: resultado.errors };
    }
    setErrors({});
    return { ok: true, errors: {} };
  }

  return {
    frequencia,
    setFrequencia,
    valor,
    valorSelecionado,
    outroValorInput,
    selecionarValor,
    alterarOutroValor,
    nome,
    setNome,
    email,
    setEmail,
    telefoneInput,
    alterarTelefone,
    cpfCnpjInput,
    alterarCpfCnpj,
    recibo,
    setRecibo,
    metodo,
    resetarParaMetodo,
    resetarTudo,
    cartao,
    alterarCartaoCampo,
    endereco,
    alterarEnderecoCampo,
    brand,
    impacto,
    valorFormatado,
    errors,
    setErrors,
    limparCartaoSensivel,
    montarDonationForm,
    validar,
  };
}

export type DonationFormState = ReturnType<typeof useDonationForm>;
