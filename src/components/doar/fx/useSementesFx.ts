"use client";

import { useEffect, useRef } from "react";

import { gsap, registerGsap, MOTION_OK } from "@/lib/fx/gsapCore";

type Semente = {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  rotacao: number;
  vr: number;
};

const TOTAL_SEMENTES = 24;
const COR_SEMENTE = "#0e8a7d";

/**
 * Efeito 18 (docs/PLAN.md) — tela "pago": particulas de "sementes" subindo
 * em canvas + o check desenhado com stroke. So roda com
 * prefers-reduced-motion: no-preference; caso contrario o check aparece
 * cheio (sem dasharray) e o canvas fica vazio.
 */
export function useSementesFx(ativo: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const checkRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!ativo) return;
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, () => {
      const checkPath = checkRef.current;
      if (checkPath) {
        const length = checkPath.getTotalLength();
        gsap.set(checkPath, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(checkPath, { strokeDashoffset: 0, duration: 0.65, ease: "power2.out", delay: 0.1 });
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);

      const sementes: Semente[] = Array.from({ length: TOTAL_SEMENTES }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * canvas.height * 0.5,
        vy: -(0.5 + Math.random() * 1) * dpr,
        vx: (Math.random() - 0.5) * 0.35 * dpr,
        size: (2.5 + Math.random() * 2.5) * dpr,
        rotacao: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.04,
      }));

      let ativoRaf = true;
      let rafId = 0;

      function desenhar() {
        if (!ativoRaf || !ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = COR_SEMENTE;
        for (const s of sementes) {
          s.y += s.vy;
          s.x += s.vx;
          s.rotacao += s.vr;
          if (s.y < -20 * dpr) {
            s.y = canvas.height + 20 * dpr;
            s.x = Math.random() * canvas.width;
          }
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rotacao);
          ctx.beginPath();
          ctx.ellipse(0, 0, s.size, s.size * 1.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        rafId = requestAnimationFrame(desenhar);
      }
      rafId = requestAnimationFrame(desenhar);

      return () => {
        ativoRaf = false;
        cancelAnimationFrame(rafId);
      };
    });

    return () => mm.revert();
  }, [ativo]);

  return { canvasRef, checkRef };
}
