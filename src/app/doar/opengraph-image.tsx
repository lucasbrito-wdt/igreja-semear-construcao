import { ImageResponse } from "next/og";
import { ogImageContentType, ogImageFonts, ogImageSize, OgImageContent } from "@/lib/og-image";

export const alt = "Doe para a construção do novo templo da Igreja Semear em Guarabira-PB";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return new ImageResponse(
    <OgImageContent headline="Faça parte da obra" subtitle="Doe por Pix, cartão ou boleto · doação única ou mensal" />,
    { ...size, fonts: ogImageFonts },
  );
}
