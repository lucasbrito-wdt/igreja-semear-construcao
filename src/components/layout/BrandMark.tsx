import Image from "next/image";
import styles from "./BrandMark.module.css";

type BrandMarkProps = {
  size?: number;
};

/** Selo quadrado com o simbolo da igreja, usado no header e no rodape. */
export function BrandMark({ size = 34 }: Readonly<BrandMarkProps>) {
  return (
    <span className={`smMark ${styles.mark}`} style={{ width: size, height: size }}>
      <span className={styles.imgWrap}>
        <Image src="/images/logo-mark.png" alt="" fill sizes={`${size}px`} style={{ objectFit: "contain" }} />
      </span>
    </span>
  );
}
