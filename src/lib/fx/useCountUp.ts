"use client";

import { useEffect } from "react";
import { gsap, registerGsap, MOTION_OK } from "./gsapCore";
import { formatCounterValue, type CounterFormat } from "./format";

/**
 * Anima de 0 ate o valor final os elementos [data-fx="counter"], terminando
 * exatamente no mesmo texto que o servidor ja renderizou (data-fx-value +
 * data-fx-format descrevem o valor/format usados no JSX original).
 */
export function useCountUp() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const ctx = gsap.context(() => {
        document.querySelectorAll<HTMLElement>('[data-fx="counter"]').forEach((el) => {
          const format = el.dataset.fxFormat as CounterFormat | undefined;
          const raw = el.dataset.fxValue;
          if (!format || raw === undefined) return;
          const target = Number(raw);
          if (Number.isNaN(target)) return;

          const finalText = el.textContent;
          const state = { value: 0 };
          gsap.to(state, {
            value: target,
            duration: 1.7,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
            onUpdate: () => {
              el.textContent = formatCounterValue(format, state.value);
            },
            onComplete: () => {
              if (finalText) el.textContent = finalText;
            },
          });
        });
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
