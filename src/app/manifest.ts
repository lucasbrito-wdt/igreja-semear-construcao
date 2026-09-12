import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Igreja Semear — Construção do Novo Templo",
    short_name: "Semear",
    description: "Doações para a construção do novo templo da Igreja Batista Semear em Guarabira-PB.",
    start_url: "/",
    display: "standalone",
    lang: "pt-BR",
    theme_color: "#0e8a7d",
    background_color: "#f6f3ee",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
