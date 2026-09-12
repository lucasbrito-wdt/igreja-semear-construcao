"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { TransitionLink } from "@/components/fx/TransitionLink";
import { trackSelectCta } from "@/lib/analytics/events";

type TrackedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  ctaId: string;
  ctaLabel: string;
  ctaLocation: string;
  children: ReactNode;
};

/**
 * CTA de conversao instrumentado com select_cta. Ancoras internas (href
 * comecando com "#") renderizam um <a> simples, preservando o scroll nativo
 * da pagina; os demais destinos usam TransitionLink, para manter as
 * transicoes e os data-fx existentes.
 */
export function TrackedLink({ href, ctaId, ctaLabel, ctaLocation, ...rest }: TrackedLinkProps) {
  function handleClick() {
    trackSelectCta({ cta_id: ctaId, cta_label: ctaLabel, cta_location: ctaLocation, link_destino: href });
  }

  if (href.startsWith("#")) {
    return <a href={href} onClick={handleClick} {...rest} />;
  }

  return <TransitionLink href={href} onClick={handleClick} {...rest} />;
}
