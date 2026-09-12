"use client";

import { useRef } from "react";

import styles from "../DoacaoForm.module.css";
import { useSelectionMorphFx } from "../fx/useFormMicroFx";
import type { DonationFormState } from "../useDonationForm";

const NOTA_UNICA =
  "Uma contribuição pontual, no valor que você definir. Se preferir sustentar o cronograma mês a mês, escolha a doação mensal.";
const NOTA_MENSAL =
  "A doação mensal é o que permite fechar contrato com o fornecedor sem parar a obra. Você pode cancelar quando quiser pelo e-mail de confirmação.";

/** 01 — Frequência: doação única ou mensal. */
export function FrequenciaStep({ form }: { form: DonationFormState }) {
  const gridRef = useRef<HTMLDivElement>(null);
  useSelectionMorphFx(form.frequencia, gridRef);

  return (
    <div className={styles.stepBlock}>
      <div className={styles.stepLabel}>01 — Frequência</div>
      <div
        className={styles.freqGrid}
        ref={gridRef}
        role="radiogroup"
        aria-label="Frequência da doação"
      >
        <FreqButton
          testId="freq-unica"
          ativo={form.frequencia === "unica"}
          titulo="Doação única"
          descricao="Uma contribuição agora"
          onClick={() => form.setFrequencia("unica")}
        />
        <FreqButton
          testId="freq-mensal"
          ativo={form.frequencia === "mensal"}
          titulo="Doação mensal"
          descricao="Sustenta o cronograma da obra"
          onClick={() => form.setFrequencia("mensal")}
        />
      </div>
      <p className={styles.hint}>{form.frequencia === "mensal" ? NOTA_MENSAL : NOTA_UNICA}</p>
    </div>
  );
}

function FreqButton(props: {
  testId: string;
  ativo: boolean;
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.ativo}
      data-selected={props.ativo}
      data-testid={props.testId}
      className={styles.freqBtn}
      onClick={props.onClick}
    >
      <div className={styles.freqBtnTitle}>{props.titulo}</div>
      <div className={styles.freqBtnDesc}>{props.descricao}</div>
    </button>
  );
}
