"use client";

import { useEffect } from "react";
import { gsap, registerGsap, FINE_POINTER } from "./gsapCore";

const HIDE_SELECTOR = "input, textarea, select, [contenteditable='true']";
const GROW_SELECTOR = "a, button, [data-fx='magnetic'], [data-fx='tier'], [role='button']";

/**
 * Cursor personalizado (anel que cresce sobre clicaveis). So pointer:fine.
 * Some sobre campos de texto para nao atrapalhar o cursor nativo.
 */
export function useCursorFx() {
  useEffect(() => {
    registerGsap();
    const mm = gsap.matchMedia();

    mm.add(FINE_POINTER, () => {
      const cursor = document.createElement("div");
      cursor.className = "fxCursor";
      cursor.setAttribute("aria-hidden", "true");
      document.body.appendChild(cursor);
      document.documentElement.classList.add("fxCursorActive");
      gsap.set(cursor, { xPercent: -50, yPercent: -50 });

      const moveX = gsap.quickTo(cursor, "x", { duration: 0.22, ease: "power3.out" });
      const moveY = gsap.quickTo(cursor, "y", { duration: 0.22, ease: "power3.out" });

      function onMove(event: MouseEvent) {
        moveX(event.clientX);
        moveY(event.clientY);
        gsap.to(cursor, { opacity: 1, duration: 0.15 });
        const target = event.target as HTMLElement | null;
        cursor.classList.toggle("fxCursorHide", !!target?.closest(HIDE_SELECTOR));
        cursor.classList.toggle("fxCursorGrow", !!target?.closest(GROW_SELECTOR));
      }
      function onLeaveWindow() {
        gsap.to(cursor, { opacity: 0, duration: 0.15 });
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseleave", onLeaveWindow);

      return () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseleave", onLeaveWindow);
        document.documentElement.classList.remove("fxCursorActive");
        cursor.remove();
      };
    });

    return () => mm.revert();
  }, []);
}
