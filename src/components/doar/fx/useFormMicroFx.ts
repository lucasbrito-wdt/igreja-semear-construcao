"use client";

import { useEffect, useRef } from "react";

import { gsap, registerGsap, MOTION_OK } from "@/lib/fx/gsapCore";

/**
 * Efeito 20 (docs/PLAN.md) — microinteracoes do formulario: morph de
 * selecao, shake no erro e loading no botao. Tudo atras de
 * gsap.matchMedia(prefers-reduced-motion: no-preference), com cleanup.
 */

/** Anima o preenchimento do botao recem-selecionado (frequencia/valor/metodo). */
export function useSelectionMorphFx(selecionado: unknown, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const alvo = containerRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
      if (!alvo) return;
      gsap.fromTo(
        alvo,
        { scale: 0.96 },
        { scale: 1, duration: 0.32, ease: "back.out(2.4)" }
      );
    });
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionado]);
}

/** Sacode o elemento quando `gatilho` muda (usado ao falhar a validacao). */
export function useShakeFx(gatilho: number) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gatilho === 0) return;
    registerGsap();
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      if (!ref.current) return;
      const tl = gsap.timeline();
      tl.fromTo(
        ref.current,
        { x: -8 },
        { x: 8, duration: 0.08, repeat: 3, yoyo: true, ease: "power1.inOut" }
      ).to(ref.current, { x: 0, duration: 0.08 });
    });
    return () => mm.revert();
  }, [gatilho]);

  return ref;
}

/** Pulsa os pontos do botao "Processando..." enquanto `carregando` for true. */
export function useButtonLoadingFx(carregando: boolean) {
  const dotsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!carregando) return;
    registerGsap();
    const mm = gsap.matchMedia();
    let timeline: gsap.core.Timeline | null = null;

    mm.add(MOTION_OK, () => {
      const dots = dotsRef.current?.querySelectorAll<HTMLElement>("i");
      if (!dots || dots.length === 0) return;
      timeline = gsap.timeline({ repeat: -1 });
      timeline.to(dots, { opacity: 1, duration: 0.35, stagger: 0.15, ease: "power1.inOut" }).to(
        dots,
        { opacity: 0.3, duration: 0.35, stagger: 0.15, ease: "power1.inOut" },
        0.15
      );
    });

    return () => {
      timeline?.kill();
      mm.revert();
    };
  }, [carregando]);

  return dotsRef;
}
