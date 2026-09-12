import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FxProvider } from "@/components/fx/FxProvider";
import { Preloader } from "@/components/fx/Preloader";
import { SITE_URL, SITE_NAME, SEO, KEYWORDS, buildJsonLd, serializeJsonLd } from "@/lib/seo";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO.home.title,
    template: `%s | ${SITE_NAME}`,
  },
  description: SEO.home.description,
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: "Igreja Batista Semear" }],
  creator: "Igreja Batista Semear",
  publisher: "Igreja Batista Semear",
  category: "religion",
  formatDetection: {
    telephone: false,
  },
  alternates: { canonical: "/" },
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
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: SITE_NAME,
    title: SEO.home.ogTitle,
    description: SEO.home.ogDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.home.ogTitle,
    description: SEO.home.ogDescription,
  },
  appleWebApp: {
    title: "Semear",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e8a7d",
};

const jsonLd = buildJsonLd();

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
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
