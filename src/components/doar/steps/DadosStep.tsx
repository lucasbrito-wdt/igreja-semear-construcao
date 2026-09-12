"use client";

import styles from "../DoacaoForm.module.css";
import type { DonationFormState } from "../useDonationForm";

/** 03 — Seus dados: nome, e-mail, WhatsApp e CPF/CNPJ. */
export function DadosStep({ form }: { form: DonationFormState }) {
  const telefoneOpcional = form.metodo !== "cartao";

  return (
    <div className={styles.stepBlock}>
      <div className={styles.stepLabel}>03 — Seus dados</div>
      <div className={styles.dadosGrid}>
        <Campo
          testId="campo-nome"
          full
          label="Nome completo"
          value={form.nome}
          onChange={form.setNome}
          autoComplete="name"
          erro={form.errors.nome}
        />
        <Campo
          testId="campo-email"
          label="E-mail"
          type="email"
          value={form.email}
          onChange={form.setEmail}
          autoComplete="email"
          noSpellCheck
          erro={form.errors.email}
        />
        <div className={styles.field}>
          <input
            data-testid="campo-telefone"
            placeholder={telefoneOpcional ? "WhatsApp (opcional)" : "WhatsApp"}
            aria-label={telefoneOpcional ? "WhatsApp (opcional)" : "WhatsApp"}
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            value={form.telefoneInput}
            onChange={(e) => form.alterarTelefone(e.target.value)}
            aria-invalid={Boolean(form.errors.telefone)}
            aria-describedby={form.errors.telefone ? "telefone-erro" : "telefone-help"}
          />
          {telefoneOpcional && <span className={styles.fieldHelpMsg} id="telefone-help">Para avisos sobre sua doação.</span>}
          {form.errors.telefone ? (
            <p id="telefone-erro" className={styles.fieldErrMsg} role="alert">
              {form.errors.telefone}
            </p>
          ) : (
            <p id="telefone-help" className={styles.fieldHelp}>
              Usamos apenas para avisos sobre o status da sua doação.
            </p>
          )}
        </div>
        <div
          className={`${styles.field} ${styles.full} ${form.errors.cpfCnpj ? styles.err : ""}`}
        >
          <input
            data-testid="campo-cpf-cnpj"
            placeholder="CPF ou CNPJ"
            aria-label="CPF ou CNPJ"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            value={form.cpfCnpjInput}
            onChange={(e) => form.alterarCpfCnpj(e.target.value)}
            aria-invalid={Boolean(form.errors.cpfCnpj)}
            aria-describedby={form.errors.cpfCnpj ? "cpfCnpj-erro" : "cpfCnpj-help"}
          />
          {form.errors.cpfCnpj ? (
            <p id="cpfCnpj-erro" className={styles.fieldErrMsg} role="alert">
              {form.errors.cpfCnpj}
            </p>
          ) : (
            <p id="cpfCnpj-help" className={styles.fieldHelp}>
              Exigido pelo meio de pagamento para emitir o recibo da sua doação.
            </p>
          )}
        </div>
      </div>
      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={form.recibo}
          onChange={(e) => form.setRecibo(e.target.checked)}
        />
        <span>Quero receber o recibo de doação e o relatório mensal da obra por e-mail.</span>
      </label>
    </div>
  );
}

function Campo(props: {
  testId: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  full?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
  erro?: string;
  noSpellCheck?: boolean;
}) {
  const errId = `${props.testId}-erro`;
  return (
    <div className={`${styles.field} ${props.full ? styles.full : ""} ${props.erro ? styles.err : ""}`}>
      <input
        data-testid={props.testId}
        type={props.type ?? "text"}
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
