"use client";

import { useEffect } from "react";
import { gsap, registerGsap, DESKTOP_MOTION } from "./gsapCore";

const MOBILE_MOTION = "(prefers-reduced-motion: no-preference) and (max-width: 1023.98px)";

/**
 * Etapas: em telas >= 1024px a secao fica pinada e o trilho desliza na
 * horizontal conforme o scroll vertical. Abaixo disso, reveal simples.
 */
export function useEtapasFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add({ desktop: DESKTOP_MOTION, mobile: MOBILE_MOTION }, (context) => {
      const desktop = context.conditions?.desktop ?? false;
      const section = document.getElementById("etapas");
      const track = document.querySelector<HTMLElement>('[data-fx="etapas-track"]');
      if (!section || !track) return;

      const steps = Array.from(track.children) as HTMLElement[];

      if (desktop) {
        gsap.set(track, { display: "flex", flexWrap: "nowrap", width: "max-content" });
        gsap.set(steps, { flex: "0 0 clamp(260px, 22vw, 340px)" });

        const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { clearProps: "display,flexWrap,width,x" });
          gsap.set(steps, { clearProps: "flex" });
        };
      }

      gsap.from(steps, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: track, start: "top 85%" },
      });
    });

    return () => mm.revert();
  }, []);
}
