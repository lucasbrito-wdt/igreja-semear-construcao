"use client";

import { useEffect } from "react";
import { gsap, registerGsap, FINE_POINTER } from "./gsapCore";

const MAX_TILT = 6;

/**
 * Tiers de doacao: tilt 3D sutil seguindo o ponteiro + spotlight radial
 * teal. So com pointer:fine (nada de tilt fantasma em touch).
 */
export function useTiersFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(FINE_POINTER, () => {
      const ctx = gsap.context(() => {
        const cleanups: Array<() => void> = [];

        document.querySelectorAll<HTMLElement>('[data-fx="tier"]').forEach((tier) => {
          const rotateX = gsap.quickTo(tier, "rotationX", { duration: 0.5, ease: "power3.out" });
          const rotateY = gsap.quickTo(tier, "rotationY", { duration: 0.5, ease: "power3.out" });
          gsap.set(tier, { transformPerspective: 700, transformStyle: "preserve-3d" });

          function onMove(event: MouseEvent) {
            const rect = tier.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width;
            const py = (event.clientY - rect.top) / rect.height;
            rotateY(gsap.utils.clamp(-MAX_TILT, MAX_TILT, (px - 0.5) * MAX_TILT * 2));
            rotateX(gsap.utils.clamp(-MAX_TILT, MAX_TILT, (0.5 - py) * MAX_TILT * 2));
            tier.style.setProperty("--fx-x", `${px * 100}%`);
            tier.style.setProperty("--fx-y", `${py * 100}%`);
          }
          function onEnter() {
            tier.setAttribute("data-fx-spotlight", "on");
          }
          function onLeave() {
            tier.removeAttribute("data-fx-spotlight");
            rotateX(0);
            rotateY(0);
          }

          tier.addEventListener("mousemove", onMove);
          tier.addEventListener("mouseenter", onEnter);
          tier.addEventListener("mouseleave", onLeave);
          cleanups.push(() => {
            tier.removeEventListener("mousemove", onMove);
            tier.removeEventListener("mouseenter", onEnter);
            tier.removeEventListener("mouseleave", onLeave);
          });
        });

        return () => cleanups.forEach((fn) => fn());
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
