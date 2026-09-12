"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, MouseEvent } from "react";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => void;
};

type TransitionLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href">;

/**
 * Wrapper de next/link que usa a View Transitions API nativa
 * (document.startViewTransition) quando disponivel, para dar uma
 * transicao suave entre a home e /doar. Sem suporte no browser, ou com
 * reduced motion, cai no comportamento padrao do Link (nao quebra nada).
 * O fallback puramente visual (fade em navegacoes cross-document) fica em
 * src/styles/fx.css (@view-transition { navigation: auto }).
 */
export function TransitionLink({ href, onClick, ...rest }: TransitionLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const doc = document as DocumentWithViewTransition;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || prefersReduced) return;

    event.preventDefault();
    const target = typeof href === "string" ? href : href.pathname ?? "/";
    doc.startViewTransition(() => {
      router.push(target);
    });
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
