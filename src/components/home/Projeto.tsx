import Image from "next/image";
import styles from "./Projeto.module.css";
import { NUMEROS } from "@/lib/content";
import type { CounterFormat } from "@/lib/fx/format";

/** Numeros da obra que tem contraparte numerica para o count-up (ver useCountUp). */
const NUMERO_COUNT: Record<string, { value: number; format: CounterFormat }> = {
  "1.200": { value: 1200, format: "int-dot" },
  "2.400 m²": { value: 2400, format: "m2" },
  "8": { value: 8, format: "int" },
};

/** Secao "O projeto, sala por sala": galeria do render oficial e numeros da obra. */
export function Projeto() {
  return (
    <section id="projeto" className={styles.section}>
      <div className={`smWrap ${styles.headRow}`}>
        <h2 className={styles.title} data-fx="section-title">
          O projeto,
          <br />
          sala por sala
        </h2>
        <p className={styles.subtitle}>
          Projeto executivo aprovado pela prefeitura em 2025. Imagens do render oficial da obra — é exatamente
          isso que vai ser entregue.
        </p>
      </div>

      <div className={`smWrap smMedia ${styles.gallery}`}>
        <figure className={`smFig smFigMain ${styles.figure} ${styles.figureMain}`} data-fx="gallery-item">
          <div className={styles.parallaxLayer} data-fx="gallery-parallax">
            <Image src="/images/auditorio.jpg" alt="Auditório com 1.200 lugares" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
          <figcaption className={`${styles.caption} ${styles.captionMain}`}>
            <div className={`${styles.captionEyebrow} ${styles.captionEyebrowMain}`}>01 — Auditório</div>
            <div className={styles.captionTitleMain}>1.200 assentos, acústica tratada</div>
            <p className={styles.captionDesc}>
              Piso em madeira, treliça metálica aparente e visão livre do palco em qualquer fileira. Um culto
              passa a caber onde hoje são dois.
            </p>
          </figcaption>
        </figure>

        <figure className={`smFig smFigSub ${styles.figure} ${styles.figureSub}`} data-fx="gallery-item">
          <div className={styles.parallaxLayer} data-fx="gallery-parallax">
            <Image src="/images/mezanino.jpg" alt="Mezanino" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
          <figcaption className={`${styles.caption} ${styles.captionSub}`}>
            <div className={`${styles.captionEyebrow} ${styles.captionEyebrowSub}`}>02 — Mezanino</div>
            <div className={styles.captionTitleSub}>Acessibilidade e sala de apoio</div>
          </figcaption>
        </figure>

        <figure className={`smFig smFigSub ${styles.figure} ${styles.figureSub}`} data-fx="gallery-item">
          <div className={styles.parallaxLayer} data-fx="gallery-parallax">
            <Image src="/images/acessos.jpg" alt="Acesso lateral e cobogós" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </div>
          <figcaption className={`${styles.caption} ${styles.captionSub}`}>
            <div className={`${styles.captionEyebrow} ${styles.captionEyebrowSub}`}>03 — Acessos</div>
            <div className={styles.captionTitleSub}>Cobogós, rampas e praça na rua</div>
          </figcaption>
        </figure>
      </div>

      <div className={styles.numbersWrap}>
        <div className={`smWrap smNums4 ${styles.numbers}`}>
          {NUMEROS.map((n) => {
            const count = NUMERO_COUNT[n.v];
            return (
              <div key={n.l} className={styles.numberItem} data-fx="number">
                <div
                  className={styles.numberValue}
                  data-fx="counter"
                  data-fx-value={count?.value}
                  data-fx-format={count?.format}
                >
                  {n.v}
                </div>
                <div className={styles.numberLabel}>{n.l}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
