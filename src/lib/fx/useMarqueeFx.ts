"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, registerGsap, MOTION_OK } from "./gsapCore";

const BASE_SPEED = 40; // px/s de base, mesma sensacao da animacao CSS original

/**
 * Marquee com velocidade reativa ao scroll: acelera com a velocidade do
 * scroll e inverte a direcao do loop conforme o sentido do scroll.
 */
export function useMarqueeFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const ctx = gsap.context(() => {
        const track = document.querySelector<HTMLElement>('[data-fx="marquee"]');
        if (!track) return;

        // a animacao CSS (smMarquee) some para dar lugar ao loop controlado pelo GSAP
        gsap.set(track, { animation: "none", xPercent: 0 });

        const width = track.scrollWidth / 2;
        const baseDuration = width / BASE_SPEED;
        const loop = gsap.to(track, {
          xPercent: -50,
          duration: baseDuration,
          ease: "none",
          repeat: -1,
        });

        const trigger = ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate(self) {
            const velocity = gsap.utils.clamp(-2.5, 2.5, self.getVelocity() / 900);
            const dir = self.direction === -1 ? -1 : 1;
            const boost = 1 + Math.abs(velocity);
            loop.timeScale(dir * boost);
          },
          onLeaveBack() {
            loop.timeScale(1);
          },
        });

        return () => {
          trigger.kill();
          loop.kill();
        };
      });
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);
}
