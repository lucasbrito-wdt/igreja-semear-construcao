import { ImageResponse } from "next/og";
import { ogImageContentType, ogImageFonts, ogImageSize, OgImageContent } from "@/lib/og-image";

export const alt = "Construção do novo templo da Igreja Semear em Guarabira-PB";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return new ImageResponse(
    <OgImageContent headline="Cada tijolo é uma semente." subtitle="Construção do novo templo · Guarabira-PB" />,
    { ...size, fonts: ogImageFonts },
  );
}
