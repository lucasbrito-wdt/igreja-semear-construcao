"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, registerGsap, MOTION_OK } from "./gsapCore";

let activeLenis: Lenis | null = null;

/** Usado por outros efeitos (ex.: TransitionLink) para parar/retomar o scroll suave. */
export function getLenis(): Lenis | null {
  return activeLenis;
}

function headerOffset(): number {
  const header = document.querySelector<HTMLElement>("[data-fx-header]");
  return (header?.offsetHeight ?? 80) + 14;
}

/**
 * Inicializa Lenis + integra com o ticker do GSAP e o ScrollTrigger.
 * So roda com prefers-reduced-motion: no-preference (AC-U4) — inclusive
 * reage se o usuario mudar a preferencia do sistema em tempo real.
 * Tambem liga as ancoras do menu (href="#...") ao lenis.scrollTo com offset do header.
 */
export function useLenisScroll() {
  useEffect(() => {
    registerGsap();
    const media = window.matchMedia(MOTION_OK);
    let cleanup: (() => void) | undefined;

    function setup() {
      const lenis = new Lenis({ autoRaf: false, wheelMultiplier: 1 });
      activeLenis = lenis;
      document.documentElement.classList.add("lenis");

      lenis.on("scroll", ScrollTrigger.update);

      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      function onAnchorClick(event: MouseEvent) {
        const anchor = (event.target as HTMLElement)?.closest<HTMLAnchorElement>('a[href^="#"]');
        if (!anchor) return;
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector<HTMLElement>(id);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -headerOffset() });
      }
      document.addEventListener("click", onAnchorClick);

      cleanup = () => {
        document.removeEventListener("click", onAnchorClick);
        gsap.ticker.remove(tick);
        lenis.destroy();
        activeLenis = null;
        document.documentElement.classList.remove("lenis");
      };
    }

    function onChange() {
      cleanup?.();
      cleanup = undefined;
      if (media.matches) setup();
    }

    if (media.matches) setup();
    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
      cleanup?.();
    };
  }, []);
}
