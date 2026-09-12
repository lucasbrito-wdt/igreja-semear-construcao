"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, registerGsap } from "@/lib/fx/gsapCore";

const SESSION_KEY = "semear-preloader-seen";
const MAX_DURATION = 1.1;

/**
 * Preloader curto (marca + contagem 0-100), so na primeira visita da sessao
 * e so com prefers-reduced-motion: no-preference. Nunca aparece de novo na
 * mesma aba e nunca ultrapassa ~1.2s.
 *
 * Sempre renderiza o markup (evita mismatch de hidratacao) e usa
 * useLayoutEffect para remover o overlay antes do primeiro paint quando nao
 * deve aparecer — sem passar por um re-render de estado do React.
 */
export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return; // continua com display:none (default do CSS)
    }
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      return; // sessionStorage indisponivel (modo privado, etc.) — sem preloader
    }

    root.classList.add("isActive");
    registerGsap();
    document.body.style.overflow = "hidden";

    const state = { value: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        root.classList.remove("isActive");
      },
    });
    tl.to(state, {
      value: 100,
      duration: MAX_DURATION * 0.82,
      ease: "power1.inOut",
      onUpdate: () => {
        if (countRef.current) countRef.current.textContent = `${Math.round(state.value)}`;
      },
    }).to(root, { opacity: 0, duration: MAX_DURATION * 0.18, ease: "power1.out" });

    return () => {
      tl.kill();
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div ref={rootRef} className="fxPreloader" role="status" aria-label="Carregando">
      <span className="fxPreloaderCount">
        <span ref={countRef}>0</span>%
      </span>
    </div>
  );
}
