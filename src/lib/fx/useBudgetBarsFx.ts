"use client";

import { useEffect } from "react";
import { gsap, registerGsap, MOTION_OK } from "./gsapCore";

/**
 * Barras de progresso/orcamento crescendo da esquerda para a direita
 * (via transform: scaleX, nunca width), escalonadas por secao. Sobrescreve
 * a animacao CSS (smBar) da barra do hero para nao dobrar a animacao no
 * mesmo elemento.
 */
export function useBudgetBarsFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const ctx = gsap.context(() => {
        const bySection = new Map<Element, HTMLElement[]>();
        document.querySelectorAll<HTMLElement>('[data-fx="budget-bar"]').forEach((bar) => {
          const section = bar.closest("section") ?? document.body;
          const list = bySection.get(section) ?? [];
          list.push(bar);
          bySection.set(section, list);
        });

        bySection.forEach((bars, section) => {
          gsap.set(bars, { animation: "none", transformOrigin: "left center", scaleX: 0 });

          gsap.to(bars, {
            scaleX: 1,
            duration: 1.1,
            stagger: 0.14,
            ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 85%" },
          });
        });
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
