"use client";

import { useEffect } from "react";
import { gsap, SplitText, registerGsap, MOTION_OK } from "./gsapCore";

/**
 * Citacao: palavras "acendendo" (opacidade + cor) conforme o scroll passa
 * pela secao (scrub). Substitui o clip-path wipe (smWipe) do CSS, que fica
 * so para reduced-motion / antes do JS montar.
 */
export function useQuoteFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      let active = true;
      let split: SplitText | null = null;

      const ctx = gsap.context(() => {
        const quote = document.querySelector<HTMLElement>('[data-fx="quote"]');
        if (!quote) return;

        gsap.set(quote, { animation: "none", clipPath: "none", opacity: 0.22 });

        document.fonts.ready.then(() => {
          if (!active) return;
          split = SplitText.create(quote, {
            type: "words",
            autoSplit: true,
            onSplit(self) {
              gsap.set(quote, { opacity: 1 });
              gsap.set(self.words, { opacity: 0.22 });
              return gsap.to(self.words, {
                opacity: 1,
                stagger: 0.5,
                ease: "none",
                scrollTrigger: {
                  trigger: quote,
                  start: "top 75%",
                  end: "bottom 45%",
                  scrub: true,
                },
              });
            },
          });
        });

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
