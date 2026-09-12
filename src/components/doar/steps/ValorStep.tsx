"use client";

import { useRef } from "react";

import { VALORES } from "@/lib/content";
import styles from "../DoacaoForm.module.css";
import { useSelectionMorphFx } from "../fx/useFormMicroFx";
import type { DonationFormState } from "../useDonationForm";

/** 02 — Valor: seis opções rápidas + "Outro valor". */
export function ValorStep({ form }: { form: DonationFormState }) {
  const gridRef = useRef<HTMLDivElement>(null);
  useSelectionMorphFx(form.valorSelecionado ?? form.outroValorInput, gridRef);

  const usandoOutro = form.valorSelecionado === null && form.outroValorInput.length > 0;
  const erro = form.errors.valor;

  return (
    <div className={styles.stepBlock}>
      <div className={styles.stepLabel}>02 — Valor</div>
      <div className={styles.valGrid} ref={gridRef} role="radiogroup" aria-label="Valor da doação">
        {VALORES.map((v) => (
          <button
            key={v.valor}
            type="button"
            role="radio"
            aria-checked={form.valorSelecionado === v.valor}
            data-selected={form.valorSelecionado === v.valor}
            data-testid={`valor-${v.valor}`}
            className={styles.valBtn}
            onClick={() => form.selecionarValor(v.valor)}
          >
            <div className={styles.valBtnTitle}>{v.label}</div>

          </button>
        ))}
      </div>
      <div className={styles.customVal} data-selected={usandoOutro}>
        <span className={styles.customValPrefix}>R$</span>
        <input
          data-testid="valor-outro"
          placeholder="Outro valor"
          aria-label="Outro valor de doação"
          inputMode="decimal"
          value={form.outroValorInput}
          onChange={(e) => form.alterarOutroValor(e.target.value)}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? "valor-erro" : undefined}
        />
      </div>
      {erro && (
        <p id="valor-erro" className={styles.fieldErrMsg} role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
