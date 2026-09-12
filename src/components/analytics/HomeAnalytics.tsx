"use client";

import { useEffect, useRef } from "react";
import { trackViewItem } from "@/lib/analytics/events";
import { useSectionViewTracking } from "@/lib/analytics/useSectionView";

/**
 * Instrumentacao da home: dispara view_item ao montar e ativa o observer de
 * view_section por secao visivel. Componente client leve, montado uma unica
 * vez na pagina — as secoes em si continuam sendo server components.
 */
export function HomeAnalytics() {
  const enviouViewItemRef = useRef(false);

  useEffect(() => {
    if (enviouViewItemRef.current) return;
    enviouViewItemRef.current = true;
    trackViewItem();
  }, []);

  useSectionViewTracking();

  return null;
}
