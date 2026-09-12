"use client";

import { CONTATOS } from "@/lib/content";
import styles from "./DoacaoForm.module.css";
import { useButtonLoadingFx, useShakeFx } from "./fx/useFormMicroFx";
import type { DonationFormState } from "./useDonationForm";

const METODO_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  boleto: "Boleto",
};

const SANDBOX_ATIVO = process.env.NEXT_PUBLIC_PAYMENTS_SANDBOX === "true";

/** Resumo sticky com impacto dinâmico e botão de confirmação. */
export function ResumoAside({
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
  const shakeRef = useShakeFx(shakeTrigger);
  const dotsRef = useButtonLoadingFx(submitting);
  const sufixo = form.frequencia === "mensal" ? "/mês" : " única";
  const ctaTxt = form.frequencia === "mensal" ? "Confirmar doação mensal" : "Confirmar doação";

  return (
    <aside className={styles.aside}>
      <div className={styles.asideSticky}>
        <div className={styles.summaryCard} ref={shakeRef}>
          <div className={styles.summaryHead}>
            <span className={styles.summaryLbl}>Resumo</span>
            {SANDBOX_ATIVO && (
              <span className={styles.sandbox}>
                <span className={styles.dot} />
                Modo de teste
              </span>
            )}
          </div>
          <div className={styles.valueRow}>
            <span className={styles.n}>{form.valorFormatado}</span>
            <span className={styles.s}>{sufixo}</span>
          </div>
          <div className={styles.metaTable}>
            <div className={styles.r}>
              <span>Tipo</span>
              <span>{form.frequencia === "mensal" ? "Mensal recorrente" : "Doação única"}</span>
            </div>
            <div className={styles.r}>
              <span>Pagamento</span>
              <span>{METODO_LABEL[form.metodo]}</span>
            </div>
            <div className={styles.r}>
              <span>Taxa administrativa</span>
              <span>R$ 0,00</span>
            </div>
            <div className={`${styles.r} ${styles.dest}`}>
              <span>Vai para a obra</span>
              <span>100%</span>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-confirmar"
            className={styles.btnConfirm}
            disabled={submitting}
            onClick={onSubmit}
          >
            <span>{submitting ? "Processando" : `${ctaTxt} de ${form.valorFormatado}${sufixo}`}</span>
            {submitting && (
              <span className={styles.dots} ref={dotsRef} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            )}
          </button>
          {formError && (
            <p className={styles.formErr} role="alert">
              {formError}
            </p>
          )}
          <p className={styles.privacyNote}>
            Usamos seus dados apenas para processar esta doação e emitir o recibo. O CPF/CNPJ é
            exigido pelo processador de pagamento. Os dados do cartão vão direto ao processador de
            pagamento e não são armazenados pela igreja. Para exercer seus direitos sobre os dados,
            escreva para <strong>{CONTATOS.email}</strong>.
          </p>
        </div>
        <div className={styles.pixAlt}>
          <div className={styles.t}>Prefere transferir direto?</div>
          <div className={styles.d}>
            Pix CNPJ <strong>{CONTATOS.cnpj}</strong> · Igreja Batista Semear — conta exclusiva da
            construção.
          </div>
        </div>
      </div>
    </aside>
  );
}
