"use client";

import { useRef } from "react";

import styles from "../DoacaoForm.module.css";
import { useSelectionMorphFx } from "../fx/useFormMicroFx";
import type { DonationFormState } from "../useDonationForm";
import type { MetodoPagamento } from "../types";
import { trackSelectPaymentMethod } from "@/lib/analytics/events";
import {
  brandLabel,
  formatCardNumberDisplay,
  formatCep,
  formatValidadeDisplay,
  onlyDigits,
  parseValidadeInput,
} from "./cardFormat";

const METODOS: Array<{ id: MetodoPagamento; testId: string; titulo: string; descricao: string; nota: string }> = [
  {
    id: "pix",
    testId: "metodo-pix",
    titulo: "Pix",
    descricao: "Confirmação em minutos",
    nota: "Você recebe o QR Code na próxima tela e a confirmação chega em segundos.",
  },
  {
    id: "cartao",
    testId: "metodo-cartao",
    titulo: "Cartão",
    descricao: "Crédito, à vista ou mensal",
    nota: "Para doação mensal, a cobrança é automática no mesmo dia de cada mês.",
  },
  {
    id: "boleto",
    testId: "metodo-boleto",
    titulo: "Boleto",
    descricao: "Compensa em até 3 dias úteis",
    nota: "O boleto é enviado por e-mail. Para doação mensal, um novo boleto chega a cada mês.",
  },
];

/** 04 — Forma de pagamento: Pix, Cartão (com painel expandido) ou Boleto. */
export function PagamentoStep({ form }: { form: DonationFormState }) {
  const gridRef = useRef<HTMLDivElement>(null);
  useSelectionMorphFx(form.metodo, gridRef);

  const nota = METODOS.find((m) => m.id === form.metodo)?.nota ?? "";

  return (
    <div className={styles.stepBlock}>
      <div className={styles.stepLabel}>04 — Forma de pagamento</div>
      <div className={styles.payGrid} ref={gridRef} role="radiogroup" aria-label="Forma de pagamento">
        {METODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={form.metodo === m.id}
            data-selected={form.metodo === m.id}
            data-testid={m.testId}
            className={styles.payBtn}
            onClick={() => {
              form.resetarParaMetodo(m.id);
              trackSelectPaymentMethod({ payment_type: m.id, frequencia: form.frequencia });
            }}
          >
            <div className={styles.payBtnTitle}>{m.titulo}</div>
            <div className={styles.payBtnDesc}>{m.descricao}</div>
          </button>
        ))}
      </div>
      <p className={styles.payNote}>{nota}</p>

      {form.metodo === "cartao" && <CardPanel form={form} />}
    </div>
  );
}

function CardPanel({ form }: { form: DonationFormState }) {
  const numeroDisplay = formatCardNumberDisplay(form.cartao.numero);
  const validadeDisplay = formatValidadeDisplay(form.cartao.mes, form.cartao.ano);
  const bandeiraTxt = form.cartao.numero.length > 0 ? brandLabel(form.brand) : "—";

  return (
    <div className={styles.cardPanel} data-testid="bloco-cartao">
      <CampoCartao
        testId="campo-cartao-titular"
        full
        label="Nome impresso no cartão"
        value={form.cartao.titular}
        onChange={(v) => form.alterarCartaoCampo("titular", v)}
        autoComplete="cc-name"
        noSpellCheck
        erro={form.errors["cartao.titular"]}
      />

      <div
        className={`${styles.field} ${styles.full} ${styles.numWrap} ${
          form.errors["cartao.numero"] ? styles.err : ""
        }`}
      >
        <input
          data-testid="campo-cartao-numero"
          placeholder="Número do cartão"
          aria-label="Número do cartão"
          inputMode="numeric"
          autoComplete="cc-number"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          value={numeroDisplay}
          onChange={(e) => form.alterarCartaoCampo("numero", onlyDigits(e.target.value).slice(0, 19))}
          aria-invalid={Boolean(form.errors["cartao.numero"])}
          aria-describedby={form.errors["cartao.numero"] ? "cartao-numero-erro" : undefined}
        />
        <span className={styles.cardFlag} aria-hidden="true">
          {form.cartao.numero.length > 0 ? bandeiraTxt.slice(0, 4).toUpperCase() : ""}
        </span>
      </div>
      {form.errors["cartao.numero"] ? (
        <p id="cartao-numero-erro" className={`${styles.fieldErrMsg} ${styles.full}`} role="alert">
          {form.errors["cartao.numero"]}
        </p>
      ) : (
        <div className={`${styles.full} ${styles.flagNote}`}>
          <span className={styles.sw} />
          Bandeira detectada: {bandeiraTxt}
        </div>
      )}

      <CampoCartao
        testId="campo-cartao-validade"
        label="Validade (MM/AA)"
        value={validadeDisplay}
        onChange={(v) => {
          const { mes, ano } = parseValidadeInput(v);
          form.alterarCartaoCampo("mes", mes);
          form.alterarCartaoCampo("ano", ano);
        }}
        autoComplete="cc-exp"
        inputMode="numeric"
        noSpellCheck
        erro={form.errors["cartao.validade"]}
      />
      <CampoCartao
        testId="campo-cartao-cvv"
        label="CVV"
        value={form.cartao.cvv}
        onChange={(v) => form.alterarCartaoCampo("cvv", onlyDigits(v).slice(0, 4))}
        autoComplete="cc-csc"
        inputMode="numeric"
        noSpellCheck
        erro={form.errors["cartao.cvv"]}
      />

      <CampoCartao
        testId="campo-endereco-cep"
        label="CEP"
        value={form.endereco.cep}
        onChange={(v) => form.alterarEnderecoCampo("cep", formatCep(v))}
        autoComplete="postal-code"
        inputMode="numeric"
        erro={form.errors["endereco.cep"]}
      />
      <CampoCartao
        testId="campo-endereco-numero"
        label="Número"
        value={form.endereco.numero}
        onChange={(v) => form.alterarEnderecoCampo("numero", v)}
        autoComplete="off"
        erro={form.errors["endereco.numero"]}
      />

      <div className={`${styles.trustLine} ${styles.full}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="square" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <span>
          Seus dados de cartão trafegam criptografados (HTTPS) até o processador de pagamento e não
          ficam armazenados pela igreja.
        </span>
      </div>
    </div>
  );
}

function CampoCartao(props: {
  testId: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  erro?: string;
  noSpellCheck?: boolean;
}) {
  const errId = `${props.testId}-erro`;
  return (
    <div className={`${styles.field} ${props.full ? styles.full : ""} ${props.erro ? styles.err : ""}`}>
      <input
        data-testid={props.testId}
        placeholder={props.label}
        aria-label={props.label}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        spellCheck={props.noSpellCheck ? false : undefined}
        autoCorrect={props.noSpellCheck ? "off" : undefined}
        autoCapitalize={props.noSpellCheck ? "off" : undefined}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={Boolean(props.erro)}
        aria-describedby={props.erro ? errId : undefined}
      />
      {props.erro && (
        <p id={errId} className={styles.fieldErrMsg} role="alert">
          {props.erro}
        </p>
      )}
    </div>
  );
}
