"use client";

import { useEffect, useRef } from "react";

/** Move o foco para o titulo da tela assim que ela e montada (troca de step). */
export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

/** Formata segundos como M:SS, usado no cronometro do Pix. */
export function formatMinutosSegundos(totalSegundos: number): string {
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;
}
