import type { Metadata } from "next";

/** Area logada do portal do doador — nao deve ser indexada. As paginas em si sao "use client". */
export const metadata: Metadata = {
  title: "Portal do Doador",
  robots: { index: false, follow: false },
};

export default function DoadorLayout({ children }: LayoutProps<"/doador">) {
  return children;
}
