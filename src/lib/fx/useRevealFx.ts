"use client";

import { useEffect } from "react";
import { gsap, SplitText, registerGsap, MOTION_OK } from "./gsapCore";

/**
 * Reveal generico das secoes de conteudo: h2 com SplitText por linha,
 * paragrafos/cards em fade-up escalonado e filetes de 2px desenhando.
 */
export function useRevealFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      let active = true;
      const splits: SplitText[] = [];

      const ctx = gsap.context(() => {
        document.fonts.ready.then(() => {
          if (!active) return;
          document.querySelectorAll<HTMLElement>('[data-fx="section-title"]').forEach((title) => {
            const split = SplitText.create(title, {
              type: "lines",
              mask: "lines",
              autoSplit: true,
              onSplit(self) {
                return gsap.from(self.lines, {
                  yPercent: 100,
                  opacity: 0,
                  duration: 0.8,
                  stagger: 0.08,
                  ease: "power4.out",
                  scrollTrigger: { trigger: title, start: "top 85%" },
                });
              },
            });
            splits.push(split);
          });
        });

        document.querySelectorAll<HTMLElement>('[data-fx="reveal"]').forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 26,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        document.querySelectorAll<HTMLElement>('[data-fx="filete"]').forEach((el) => {
          gsap.fromTo(
            el,
            { scaleX: 0, transformOrigin: "left" },
            {
              scaleX: 1,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 90%" },
            },
          );
        });

        return () => {
          active = false;
          splits.forEach((s) => s.revert());
        };
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
