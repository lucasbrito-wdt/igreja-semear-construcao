import { formatBRL } from "@/lib/content";

export type CounterFormat = "brl" | "pct1" | "int" | "int-dot" | "m2";

/**
 * Formata um valor numerico durante o count-up de forma identica ao texto
 * final renderizado no servidor (ver Hero/Projeto). Nunca usar aqui uma
 * formatacao diferente da usada no JSX original.
 */
export function formatCounterValue(format: CounterFormat, value: number): string {
  switch (format) {
    case "brl":
      return formatBRL(Math.round(value));
    case "pct1": {
      const rounded = Math.round(value * 10) / 10;
      return `${rounded}%`;
    }
    case "int":
      return `${Math.round(value)}`;
    case "int-dot":
      return Math.round(value).toLocaleString("pt-BR");
    case "m2":
      return `${Math.round(value).toLocaleString("pt-BR")} m²`;
    default:
      return `${Math.round(value)}`;
  }
}
