"use client";

import { useEffect } from "react";
import { gsap, registerGsap, FINE_POINTER } from "./gsapCore";

const STRENGTH = 0.35;
const MAX_OFFSET = 14;

/**
 * Botoes primarios magneticos: puxam levemente em direcao ao ponteiro.
 * So com pointer:fine — em touch o smLift (CSS) cuida do feedback de toque.
 */
export function useMagneticFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(FINE_POINTER, () => {
      const ctx = gsap.context(() => {
        const cleanups: Array<() => void> = [];

        document.querySelectorAll<HTMLElement>('[data-fx="magnetic"]').forEach((el) => {
          const moveX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
          const moveY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

          function onMove(event: MouseEvent) {
            const rect = el.getBoundingClientRect();
            const relX = event.clientX - (rect.left + rect.width / 2);
            const relY = event.clientY - (rect.top + rect.height / 2);
            moveX(gsap.utils.clamp(-MAX_OFFSET, MAX_OFFSET, relX * STRENGTH));
            moveY(gsap.utils.clamp(-MAX_OFFSET, MAX_OFFSET, relY * STRENGTH));
          }
          function onLeave() {
            gsap.to(el, {
              x: 0,
              y: 0,
              duration: 0.5,
              ease: "elastic.out(1, 0.4)",
              onComplete: () => gsap.set(el, { clearProps: "transform" }),
            });
          }

          el.addEventListener("mousemove", onMove);
          el.addEventListener("mouseleave", onLeave);
          cleanups.push(() => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
          });
        });

        return () => cleanups.forEach((fn) => fn());
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
