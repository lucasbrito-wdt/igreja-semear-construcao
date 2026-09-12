"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackClickSocial } from "@/lib/analytics/events";

type Network = "instagram" | "youtube" | "site" | "maps";

type TrackedSocialLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  network: Network;
  children: ReactNode;
};

/** Link social/externo do rodape instrumentado com click_social. */
export function TrackedSocialLink({ href, network, ...rest }: TrackedSocialLinkProps) {
  function handleClick() {
    trackClickSocial({ network, link_destino: href });
  }

  return <a href={href} onClick={handleClick} {...rest} />;
}
