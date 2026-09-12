"use client";

import { useEffect, useRef } from "react";
import { trackViewSection } from "./events";

const THRESHOLD = 0.4;

/**
 * Observa todos os elementos com `data-ga-section` e dispara `view_section`
 * na primeira vez que cada um cruza 40% do viewport — uma vez por secao por
 * sessao de pagina. Usado por um unico componente client montado na home,
 * para nao converter as secoes (server components) em client components.
 */
export function useSectionViewTracking(): void {
  const vistasRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const secoes = document.querySelectorAll<HTMLElement>("[data-ga-section]");
    if (secoes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const sectionId = entry.target.getAttribute("data-ga-section");
          if (!sectionId || vistasRef.current.has(sectionId)) continue;
          vistasRef.current.add(sectionId);
          trackViewSection(sectionId);
          observer.unobserve(entry.target);
        }
      },
      { threshold: THRESHOLD }
    );

    secoes.forEach((secao) => observer.observe(secao));
    return () => observer.disconnect();
  }, []);
}
