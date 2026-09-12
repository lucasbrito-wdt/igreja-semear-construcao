"use client";

import { useEffect, useRef } from "react";

import { gsap, registerGsap, MOTION_OK } from "@/lib/fx/gsapCore";

/**
 * Efeito 19 (docs/PLAN.md) — Pix aguardando: o QR aparece em blocos que
 * desaparecem em stagger, revelando a imagem por baixo. Sem motion, os
 * blocos ja nascem transparentes via CSS (opacity:0) e o QR fica visivel
 * de imediato — o hook so cobre a versao animada.
 */
export function usePixRevealFx() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const blocos = containerRef.current?.querySelectorAll<HTMLElement>("[data-fx-block]");
      if (!blocos || blocos.length === 0) return;

      gsap.set(blocos, { opacity: 1 });
      gsap.to(blocos, {
        opacity: 0,
        duration: 0.35,
        stagger: { each: 0.03, from: "random" },
        ease: "power1.out",
        delay: 0.15,
      });
    });

    return () => mm.revert();
  }, []);

  return containerRef;
}
