"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, registerGsap, MOTION_OK } from "./gsapCore";

/**
 * Header: esconde ao descer, volta ao subir, e mostra uma barra de leitura
 * (2px) proporcional ao progresso de scroll da pagina.
 */
export function useHeaderFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const ctx = gsap.context(() => {
        const header = document.querySelector<HTMLElement>("[data-fx-header]");
        const progress = document.querySelector<HTMLElement>('[data-fx="reading-progress"]');
        if (!header) return;

        const hide = gsap.to(header, { yPercent: -100, duration: 0.35, ease: "power2.out", paused: true });

        const trigger = ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate(self) {
            if (progress) progress.style.width = `${self.progress * 100}%`;
            if (self.scroll() < header.offsetHeight) {
              hide.reverse();
              return;
            }
            if (self.direction === 1) hide.play();
            else hide.reverse();
          },
        });

        return () => trigger.kill();
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
