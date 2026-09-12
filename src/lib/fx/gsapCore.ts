import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/** Media queries usadas por todos os efeitos via gsap.matchMedia(). */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const FINE_POINTER = "(prefers-reduced-motion: no-preference) and (pointer: fine)";
export const DESKTOP_MOTION = "(prefers-reduced-motion: no-preference) and (min-width: 1024px)";

let registered = false;

/** Registra os plugins do GSAP uma unica vez, so no client. */
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  registered = true;
}

export { gsap, ScrollTrigger, SplitText };
