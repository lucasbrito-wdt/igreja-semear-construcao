import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FxProvider } from "@/components/fx/FxProvider";
import { Preloader } from "@/components/fx/Preloader";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

import { GoogleAnalytics } from "@next/third-parties/google";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const heroDescription =
  "O novo templo da Igreja Semear já tem terreno e fundação prontos. Agora é a estrutura que sobe — pilares, lajes e a cobertura do auditório — e é o que a sua doação constrói. 1.500 lugares, salas próprias para as crianças e um espaço aberto ao bairro de segunda a sábado.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cada tijolo é uma semente | Igreja Semear",
  description: heroDescription,
  alternates: { canonical: siteUrl },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/logo-mark.png",
  },
  openGraph: {
    title: "Cada tijolo é uma semente | Igreja Semear",
    description: heroDescription,
    url: siteUrl,
    siteName: "Igreja Semear",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/images/fachada.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cada tijolo é uma semente | Igreja Semear",
    description: heroDescription,
    images: ["/images/fachada.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e8a7d",
};

// Organization Schema Markup
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Igreja Semear",
  url: siteUrl,
  logo: `${siteUrl}/images/logo-mark.png`,
  description: heroDescription,
  sameAs: [
    "https://www.instagram.com/igrejasemear/",
    "https://www.youtube.com/c/IgrejaSemear"
  ]
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>
        <Preloader />
        <FxProvider />
        <div className="appShell">
          <Header />
          {children}
          <Footer />
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
