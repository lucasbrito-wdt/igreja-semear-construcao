/**
 * Conteudo compartilhado das imagens de Open Graph/Twitter (1200x630), geradas
 * via ImageResponse em runtime Node. Carrega a fachada, o icone da marca e a
 * fonte Archivo uma unica vez no escopo do modulo (nao dependem de request).
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const BRAND_COLOR = "#0e8a7d";

const fachadaBuffer = await readFile(join(process.cwd(), "public/images/fachada.jpg"));
const fachadaDataUrl = `data:image/jpeg;base64,${fachadaBuffer.toString("base64")}`;

const iconBuffer = await readFile(join(process.cwd(), "src/app/icon.png"));
const iconDataUrl = `data:image/png;base64,${iconBuffer.toString("base64")}`;

const archivoMedium = await readFile(join(process.cwd(), "src/assets/fonts/Archivo-Medium.ttf"));
const archivoSemiBold = await readFile(join(process.cwd(), "src/assets/fonts/Archivo-SemiBold.ttf"));
const archivoExtraBold = await readFile(join(process.cwd(), "src/assets/fonts/Archivo-ExtraBold.ttf"));

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

export const ogImageFonts = [
  { name: "Archivo", data: archivoExtraBold, style: "normal" as const, weight: 800 as const },
  { name: "Archivo", data: archivoSemiBold, style: "normal" as const, weight: 600 as const },
  { name: "Archivo", data: archivoMedium, style: "normal" as const, weight: 500 as const },
];

type OgImageContentProps = {
  headline: string;
  subtitle: string;
};

/** Layout visual da imagem: fachada com overlay na cor da marca, headline, subtitulo, botao "Doe agora" e a marca Igreja Semear. */
export function OgImageContent({ headline, subtitle }: OgImageContentProps) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        fontFamily: "Archivo",
      }}
    >
      <img
        src={fachadaDataUrl}
        width={1200}
        height={630}
        style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(160deg, rgba(13,20,18,0.94) 0%, rgba(14,138,125,0.80) 55%, rgba(13,20,18,0.90) 100%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "60px 76px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "#ffffff",
            }}
          >
            <img src={iconDataUrl} width={38} height={38} />
          </div>
          <span style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#ffffff", letterSpacing: 2 }}>
            IGREJA SEMEAR
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 900 }}>
          <div style={{ display: "flex", fontSize: 78, fontWeight: 800, color: "#ffffff", lineHeight: 1.08 }}>
            {headline}
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "22px 48px",
              borderRadius: 100,
              background: "#ffffff",
              color: BRAND_COLOR,
              fontSize: 30,
              fontWeight: 600,
            }}
          >
            Doe agora
          </div>
        </div>
      </div>
    </div>
  );
}
