"use client";

import { useEffect } from "react";
import { gsap, SplitText, registerGsap, MOTION_OK } from "./gsapCore";

/**
 * Hero: titulo com SplitText por palavra + mascara, parallax da fachada
 * (no wrapper, sem tocar no scale do Ken Burns que ja anima a <img>) e a
 * grade de 6 colunas "desenhando" via clip-path.
 */
export function useHeroFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      let active = true;
      let split: SplitText | null = null;

      const ctx = gsap.context(() => {
        const title = document.querySelector<HTMLElement>('[data-fx="hero-title"]');
        if (title) {
          document.fonts.ready.then(() => {
            if (!active) return;
            split = SplitText.create(title, {
              type: "words",
              mask: "words",
              autoSplit: true,
              onSplit(self) {
                return gsap.from(self.words, {
                  yPercent: 120,
                  opacity: 0,
                  duration: 0.9,
                  stagger: 0.045,
                  ease: "power4.out",
                });
              },
            });
          });
        }

        document.querySelectorAll<HTMLElement>('[data-fx="hero-bg"]').forEach((wrap) => {
          gsap.to(wrap, {
            yPercent: 16,
            ease: "none",
            scrollTrigger: {
              trigger: wrap.closest("section") ?? wrap,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        });

        const grid = document.querySelector<HTMLElement>('[data-fx="hero-grid"]');
        if (grid) {
          gsap.fromTo(
            grid,
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power3.inOut", delay: 0.1 },
          );
        }

        return () => {
          active = false;
          split?.revert();
        };
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
