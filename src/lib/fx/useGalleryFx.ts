"use client";

import { useEffect } from "react";
import { gsap, registerGsap, MOTION_OK } from "./gsapCore";

/**
 * Galeria do projeto: reveal com clip-path ao entrar na viewport + parallax
 * interno da camada de imagem (o zoom no hover continua via CSS em .smFig).
 */
export function useGalleryFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const ctx = gsap.context(() => {
        document.querySelectorAll<HTMLElement>('[data-fx="gallery-item"]').forEach((figure) => {
          gsap.fromTo(
            figure,
            { clipPath: "inset(12% 0 12% 0)", opacity: 0 },
            {
              clipPath: "inset(0% 0 0% 0)",
              opacity: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: figure, start: "top 88%" },
            },
          );
        });

        document.querySelectorAll<HTMLElement>('[data-fx="gallery-parallax"]').forEach((layer) => {
          gsap.to(layer, {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: layer.closest("figure") ?? layer,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        });
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
