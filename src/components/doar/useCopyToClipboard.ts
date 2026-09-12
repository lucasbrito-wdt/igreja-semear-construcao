"use client";

import { useRef, useState } from "react";

const DURACAO_COPIADO_MS = 2200;

/** Copia texto via Clipboard API, com fallback de selecao para navegadores sem suporte. */
export function useCopyToClipboard() {
  const [copiado, setCopiado] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function copiarComFallback(texto: string, source: HTMLElement | null) {
    if (source) {
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    try {
      document.execCommand("copy");
    } catch {
      // sem suporte — o texto ao menos fica selecionado para o usuario copiar manualmente
    }
    window.getSelection()?.removeAllRanges();
  }

  async function copiar(texto: string, source: HTMLElement | null = null) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(texto);
      } catch {
        copiarComFallback(texto, source);
      }
    } else {
      copiarComFallback(texto, source);
    }

    setCopiado(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiado(false), DURACAO_COPIADO_MS);
  }

  return { copiado, copiar };
}
