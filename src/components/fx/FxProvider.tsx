"use client";

import { useEffect } from "react";
import { registerGsap, ScrollTrigger } from "@/lib/fx/gsapCore";
import { useLenisScroll } from "@/lib/fx/useLenisScroll";
import { useHeroFx } from "@/lib/fx/useHeroFx";
import { useMarqueeFx } from "@/lib/fx/useMarqueeFx";
import { useRevealFx } from "@/lib/fx/useRevealFx";
import { useGalleryFx } from "@/lib/fx/useGalleryFx";
import { useEtapasFx } from "@/lib/fx/useEtapasFx";
import { useCountUp } from "@/lib/fx/useCountUp";
import { useBudgetBarsFx } from "@/lib/fx/useBudgetBarsFx";
import { useQuoteFx } from "@/lib/fx/useQuoteFx";
import { useTiersFx } from "@/lib/fx/useTiersFx";
import { useMagneticFx } from "@/lib/fx/useMagneticFx";
import { useHeaderFx } from "@/lib/fx/useHeaderFx";
import { useCursorFx } from "@/lib/fx/useCursorFx";

/**
 * Orquestra todos os efeitos GSAP/Lenis da home. Nao renderiza nada visivel
 * (o cursor e o preloader cuidam do proprio DOM). Cada hook interno se
 * registra atras de gsap.matchMedia() e so ativa com
 * prefers-reduced-motion: no-preference (ver src/lib/fx/gsapCore.ts).
 */
export function FxProvider() {
  useLenisScroll();
  useHeroFx();
  useMarqueeFx();
  useRevealFx();
  useGalleryFx();
  useEtapasFx();
  useCountUp();
  useBudgetBarsFx();
  useQuoteFx();
  useTiersFx();
  useMagneticFx();
  useHeaderFx();
  useCursorFx();

  useEffect(() => {
    registerGsap();
    function refresh() {
      ScrollTrigger.refresh();
    }
    document.fonts?.ready?.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);
    const images = Array.from(document.images).filter((img) => !img.complete);
    images.forEach((img) => img.addEventListener("load", refresh, { once: true }));
    return () => window.removeEventListener("load", refresh);
  }, []);

  return null;
}
