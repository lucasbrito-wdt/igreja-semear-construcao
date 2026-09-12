"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { toApiPayload, type DonationErrors } from "@/lib/validation/donation";
import type { CampaignStats } from "@/lib/campaign/types";
import { sendGAEvent } from "@next/third-parties/google";
import { FormularioDoacao } from "./FormularioDoacao";
import { useDonationForm } from "./useDonationForm";
import { useSubmitDonation } from "./useSubmitDonation";
import { TelaPixAguardando } from "./screens/TelaPixAguardando";
import { TelaBoleto } from "./screens/TelaBoleto";
import { TelaRecusado } from "./screens/TelaRecusado";
import { TelaErroProvedor } from "./screens/TelaErroProvedor";
import { TelaObrigado } from "./screens/TelaObrigado";
import type { DoacaoResponse, FlowStep, Frequencia } from "./types";

const FIELD_TESTID: Record<string, string> = {
  valor: "valor-outro",
  nome: "campo-nome",
  email: "campo-email",
  telefone: "campo-telefone",
  cpfCnpj: "campo-cpf-cnpj",
  "cartao.titular": "campo-cartao-titular",
  "cartao.numero": "campo-cartao-numero",
  "cartao.validade": "campo-cartao-validade",
  "cartao.cvv": "campo-cartao-cvv",
  "endereco.cep": "campo-endereco-cep",
  "endereco.numero": "campo-endereco-numero",
};

const ORDEM_CAMPOS = Object.keys(FIELD_TESTID);

function focarPrimeiroErro(errors: DonationErrors) {
  for (const campo of ORDEM_CAMPOS) {
    if (errors[campo as keyof DonationErrors]) {
      const testId = FIELD_TESTID[campo];
      document.querySelector<HTMLElement>(`[data-testid="${testId}"]`)?.focus();
      return;
    }
  }
}

function frequenciaLabelDe(frequencia: Frequencia): string {
  return frequencia === "mensal" ? "Doação mensal" : "Doação única";
}

/** Orquestra a maquina de estados do fluxo /doar: form -> enviando -> resultado -> pago. */
export function DoacaoFlow({
  frequenciaInicial,
  valorInicial,
  campaignStats,
}: {
  frequenciaInicial: Frequencia;
  valorInicial: number | null;
  campaignStats: CampaignStats;
}) {
  const router = useRouter();
  const form = useDonationForm(frequenciaInicial, valorInicial);
  const { submitting, enviar } = useSubmitDonation();

  const [step, setStep] = useState<FlowStep>("form");
  const [doacao, setDoacao] = useState<DoacaoResponse | null>(null);
  const [mensagemFalha, setMensagemFalha] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  // Envia begin_checkout quando o componente e montado pela primeira vez
  useState(() => {
    sendGAEvent("event", "begin_checkout", {
      currency: "BRL",
      items: [{ item_name: "Doação para Construção" }]
    });
  });

  async function handleSubmit() {
    setFormError(null);
    const resultado = form.validar();
    if (!resultado.ok) {
      setShakeTrigger((n) => n + 1);
      focarPrimeiroErro(resultado.errors);
      return;
    }

    sendGAEvent("event", "add_payment_info", {
      currency: "BRL",
      value: form.valor,
      payment_type: form.metodo,
      items: [{ item_name: "Doação para Construção" }]
    });

    setStep("enviando");
    const payload = toApiPayload(form.montarDonationForm());
    const outcome = await enviar(payload);
    form.limparCartaoSensivel();

    if (outcome.kind === "sucesso") {
      setDoacao(outcome.doacao);
      
      const isCard = outcome.doacao.metodo === "cartao";
      const eventName = isCard ? "purchase" : "generate_lead";
      sendGAEvent("event", eventName, {
        transaction_id: outcome.doacao.id,
        currency: "BRL",
        value: outcome.doacao.valor,
        payment_type: outcome.doacao.metodo,
        items: [{ item_name: "Doação para Construção" }]
      });

      if (outcome.doacao.metodo === "pix") setStep("pix-aguardando");
      else if (outcome.doacao.metodo === "boleto") setStep("boleto");
      else setStep("cartao-aprovado");
      return;
    }
    if (outcome.kind === "validacao") {
      form.setErrors(outcome.errors);
      setStep("form");
      setShakeTrigger((n) => n + 1);
      focarPrimeiroErro(outcome.errors);
      return;
    }
    if (outcome.kind === "recusado") {
      setMensagemFalha(outcome.message);
      setStep("recusado");
      return;
    }
    if (outcome.kind === "acesso-negado" || outcome.kind === "limite") {
      setStep("form");
      setFormError(outcome.message);
      return;
    }
    setStep("erro-provedor");
  }

  function handleGerarNovoPix() {
    setDoacao(null);
    setStep("form");
  }

  function handleTentarOutroCartao() {
    form.resetarParaMetodo("cartao");
    setStep("form");
  }

  function handlePagarComPix() {
    form.resetarParaMetodo("pix");
    setStep("form");
  }

  function handleTentarNovamente() {
    setStep("form");
  }

  function handleVoltarCampanha() {
    router.push("/");
  }

  function handleNovaDoacao() {
    form.resetarTudo();
    setDoacao(null);
    setMensagemFalha(null);
    setFormError(null);
    setStep("form");
  }

  if (step === "pix-aguardando" && doacao?.pix) {
    return (
      <TelaPixAguardando
        doacao={doacao}
        nome={form.nome || "amigo"}
        frequenciaLabel={frequenciaLabelDe(doacao.frequencia)}
        onPago={() => {
          sendGAEvent("event", "purchase", {
            transaction_id: doacao.id,
            currency: "BRL",
            value: doacao.valor,
            payment_type: "pix",
            items: [{ item_name: "Doação para Construção" }]
          });
          setStep("pago");
        }}
        onGerarNovoPix={handleGerarNovoPix}
      />
    );
  }

  if (step === "boleto" && doacao?.boleto) {
    return <TelaBoleto doacao={doacao} />;
  }

  if ((step === "cartao-aprovado" || step === "pago") && doacao) {
    return (
      <TelaObrigado
        doacao={doacao}
        nome={form.nome}
        email={form.email}
        campaignStats={campaignStats}
        onVoltarCampanha={handleVoltarCampanha}
        onNovaDoacao={handleNovaDoacao}
      />
    );
  }

  if (step === "recusado") {
    return (
      <TelaRecusado
        mensagem={mensagemFalha ?? "Seu banco não aprovou essa cobrança."}
        onTentarOutroCartao={handleTentarOutroCartao}
        onPagarComPix={handlePagarComPix}
      />
    );
  }

  if (step === "erro-provedor") {
    return <TelaErroProvedor onTentarNovamente={handleTentarNovamente} />;
  }

  return (
    <FormularioDoacao
      form={form}
      submitting={submitting || step === "enviando"}
      formError={formError}
      shakeTrigger={shakeTrigger}
      onSubmit={handleSubmit}
    />
  );
}
