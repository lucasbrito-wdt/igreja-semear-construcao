"use client";

import styles from "./DoacaoForm.module.css";
import { useAutoFocus } from "./useAutoFocus";
import { FrequenciaStep } from "./steps/FrequenciaStep";
import { ValorStep } from "./steps/ValorStep";
import { DadosStep } from "./steps/DadosStep";
import { PagamentoStep } from "./steps/PagamentoStep";
import { ResumoAside } from "./ResumoAside";
import type { DonationFormState } from "./useDonationForm";

/**
 * Composicao completa do formulario (01-04 + resumo). Componente proprio
 * para que o titulo receba foco sempre que o usuario volta para esta tela
 * vindo de um estado de status (recusado, Pix expirado etc.).
 */
export function FormularioDoacao({
  form,
  submitting,
  formError,
  shakeTrigger,
  onSubmit,
}: {
  form: DonationFormState;
  submitting: boolean;
  formError: string | null;
  shakeTrigger: number;
  onSubmit: () => void;
}) {
  const titleRef = useAutoFocus<HTMLHeadingElement>();

  return (
    <>
      <div className={styles.intro}>
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrowLine} />
          <span className={styles.eyebrowText}>Doação para a construção</span>
        </div>
        <h1 className={styles.title} ref={titleRef} tabIndex={-1}>
          Escolha como você quer semear.
        </h1>
      </div>
      <div className={styles.form}>
        <div className={styles.main}>
          <FrequenciaStep form={form} />
          <ValorStep form={form} />
          <DadosStep form={form} />
          <PagamentoStep form={form} />
        </div>
        <ResumoAside
          form={form}
          submitting={submitting}
          formError={formError}
          shakeTrigger={shakeTrigger}
          onSubmit={onSubmit}
        />
      </div>
    </>
  );
}
