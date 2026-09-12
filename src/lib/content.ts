/**
 * Conteudo estatico da campanha, portado de design/prototype/index.html.
 * Textos em PT-BR. Sera plugado a fontes dinamicas (Asaas) em waves futuras.
 */

export const SHOW_DEMO_NOTICE = true;

export function formatBRL(valor: number): string {
  return "R$ " + Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 0 });
}

export type TickerItem = { txt: string };

export const TICKER: TickerItem[] = [
  { txt: "1.500 lugares no auditório" },
  { txt: "Zero taxa administrativa" },
  { txt: "Relatório de obra todo dia 10" },
  { txt: "1ª etapa: cobertura, altar e banheiros" },
  { txt: "1ª etapa prevista para novembro" },
  { txt: "Conta exclusiva da construção" },
];

export type Motivo = { n: string; ic: string; t: string; d: string; dado: string };

export const MOTIVOS: Motivo[] = [
  {
    n: "01",
    ic: "✕",
    t: "Dois cultos e ainda falta lugar",
    d: "Nos domingos, dividimos a igreja em dois horários e mesmo assim há gente em pé no fundo e no corredor.",
    dado: "Novo auditório: 1.500 lugares",
  },
  {
    n: "02",
    ic: "☖",
    t: "As crianças não têm sala",
    d: "O ensino infantil acontece em espaços improvisados atrás do palco, sem isolamento acústico e sem banheiro próximo.",
    dado: "Salas próprias no projeto novo",
  },
  {
    n: "03",
    ic: "↻",
    t: "O bairro fica de fora da semana",
    d: "Cursos, atendimento e distribuição dependem de emprestar espaço. O novo templo libera as manhãs para o bairro.",
    dado: "Aberto de segunda a sábado",
  },
];

export type Numero = { v: string; l: string };

export const NUMEROS: Numero[] = [
  { v: "1.500", l: "Lugares no auditório" },
  { v: "A confirmar", l: "Área construída" },
  { v: "A confirmar", l: "Salas de ensino infantil" },
  { v: "Novembro", l: "Entrega da 1ª etapa" },
];

export type EtapaTone = "done" | "progress" | "upcoming";

export type Etapa = {
  nome: string;
  prazo: string;
  status: string;
  desc: string;
  p: number;
  tone: EtapaTone;
  toneColor: string;
  barBg: string;
};

const TONE_COLOR: Record<EtapaTone, string> = {
  done: "#3f3b36",
  progress: "#0a5f57",
  upcoming: "#9b9590",
};

function deriveBarBg(p: number): string {
  if (p === 100) return "#1a1815";
  if (p > 0) return "#0e8a7d";
  return "#d6d0c6";
}

function etapa(nome: string, prazo: string, status: string, desc: string, p: number, tone: EtapaTone): Etapa {
  return { nome, prazo, status, desc, p, tone, toneColor: TONE_COLOR[tone], barBg: deriveBarBg(p) };
}

export const ETAPAS_ATUALIZACAO = "Atualizado em setembro de 2026";

export const ETAPAS: Etapa[] = [
  etapa(
    "Terreno",
    "Concluído",
    "Concluído",
    "Compra e regularização do lote na avenida principal, no Canal do Juá.",
    100,
    "done",
  ),
  etapa(
    "Fundação",
    "Concluído",
    "Concluído",
    "Estacas, blocos e contenção do talude a leste.",
    100,
    "done",
  ),
  etapa(
    "Estrutura",
    "1ª etapa · novembro",
    "Em andamento",
    "A prioridade desta etapa é a cobertura, o altar e os banheiros. É esta fase que a campanha financia.",
    42,
    "progress",
  ),
  etapa(
    "Acabamento",
    "A confirmar",
    "A iniciar",
    "Cobogós, piso, forro acústico, elétrica e climatização.",
    0,
    "upcoming",
  ),
  etapa(
    "Entrega",
    "A confirmar",
    "A iniciar",
    "Mobiliário, praça de acesso, paisagismo e vistoria final. Algumas áreas do projeto ficam para uma etapa posterior.",
    0,
    "upcoming",
  ),
];

export type OrcamentoItem = { item: string; p: number; pctTxt: string; w: string; cor: string };

function orcamentoItem(item: string, p: number, destaque: boolean): OrcamentoItem {
  return { item, p, pctTxt: `${p}%`, w: `${p * 4}%`, cor: destaque ? "#0e8a7d" : "#1a1815" };
}

export const ORCAMENTO: OrcamentoItem[] = [
  orcamentoItem("Pilares e vigas", 24, true),
  orcamentoItem("Lajes e escadas", 23, false),
  orcamentoItem("Treliça metálica e cobertura", 21, false),
  orcamentoItem("Alvenaria e vedação", 18, false),
  orcamentoItem("Fôrmas, escoramento e aço", 14, false),
];

export type Tier = { valor: number; label: string; vira: string; href: string };

function tier(valor: number, vira: string): Tier {
  return { valor, label: formatBRL(valor), vira, href: `/doar?valor=${valor}` };
}

export const TIERS: Tier[] = [
  tier(100, "2 sacos de cimento para a laje do mezanino"),
  tier(500, "O aço de um pilar do auditório"),
  tier(1000, "2 m³ de concreto usinado da laje"),
  tier(2500, "Um pilar completo, do aço à concretagem"),
];

export type Transp = { n: string; t: string; d: string };

export const TRANSP: Transp[] = [
  {
    n: "01",
    t: "Conta exclusiva da obra",
    d: "Toda doação entra em conta separada da tesouraria geral, movimentada apenas com dupla assinatura.",
  },
  {
    n: "02",
    t: "Relatório mensal com nota fiscal",
    d: "Publicamos o extrato, as notas dos fornecedores e as fotos do canteiro no dia 10 de cada mês, no Instagram e por e-mail.",
  },
  {
    n: "03",
    t: "Zero taxa administrativa",
    d: "Os custos de plataforma são cobertos pelo orçamento ordinário da igreja. 100% da doação vira material e mão de obra.",
  },
  {
    n: "04",
    t: "Auditoria independente",
    d: "Balanço anual auditado por escritório externo, aberto a qualquer doador que solicitar.",
  },
];

export type Culto = { dia: string; hora: string };

export const CULTOS: Culto[] = [
  { dia: "Domingo", hora: "9h e 17h30" },
  { dia: "Quarta-feira", hora: "19h" },
  { dia: "Sexta-feira", hora: "19h" },
  { dia: "Sábado · Escola Bíblica", hora: "15h" },
  { dia: "Sábado · Culto Jovem", hora: "19h" },
];

export const CONTATOS = {
  email: "igrejabatistasemeargba@gmail.com",
  telefone: "(83) 8856-4852",
  endereco: "Av. Juscelino Kubitschek de Oliveira, S/N",
  bairro: "Canal do Juá — Guarabira/PB",
  cnpj: "32.703.146/0001-90",
  pastores: "Pr. Gilvan Camilo e Miss. Simone Camilo",
};

export const LINKS = {
  maps: "https://share.google/gb9q9LjZLcjpgYpci",
  instagram: "https://www.instagram.com/igrejasemeargba_/",
  youtube: "https://www.youtube.com/@IgrejaSemearGuarabira",
  site: "https://igrejasemear.com.br/",
};

/** Valores rapidos e o que cada um representa em material de obra — usados no /doar. */
export type ValorOpcao = { valor: number; label: string; nota: string };

export const VALORES: ValorOpcao[] = [
  { valor: 100, label: formatBRL(100), nota: "2 sacos de cimento" },
  { valor: 250, label: formatBRL(250), nota: "1 m² de laje concretada" },
  { valor: 500, label: formatBRL(500), nota: "O aço de um pilar" },
  { valor: 1000, label: formatBRL(1000), nota: "2 m³ de concreto usinado" },
  { valor: 2500, label: formatBRL(2500), nota: "Um pilar do auditório" },
  { valor: 5000, label: formatBRL(5000), nota: "Uma tesoura da treliça" },
];

const IMPACTO_FAIXAS: Array<[number, string]> = [
  [5000, "Uma tesoura da treliça que vence o vão do auditório."],
  [2500, "Um pilar do auditório, do aço à concretagem."],
  [1000, "Dois metros cúbicos de concreto usinado da laje."],
  [500, "O aço de um pilar do auditório."],
  [250, "Um metro quadrado de laje concretada."],
  [100, "Dois sacos de cimento da laje."],
  [0, "Material de estrutura para a próxima concretagem."],
];

/** Retorna a frase de impacto para um valor de doação — usado no /doar. */
export function getImpacto(valor: number): string {
  const faixa = IMPACTO_FAIXAS.find(([min]) => valor >= min);
  return (faixa ?? IMPACTO_FAIXAS[IMPACTO_FAIXAS.length - 1])[1];
}
