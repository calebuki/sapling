import Image from "next/image";

import storybookImage from "@/assets/home/lindbacken-storybook.png";
import styles from "@/components/storybook-backdrop.module.css";

export function StorybookBackdrop({ fixed = false }: { fixed?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`${styles.backdrop} ${fixed ? styles.fixed : ""}`}
    >
      <Image
        alt=""
        className={styles.artwork}
        placeholder="blur"
        priority
        sizes="100vw"
        src={storybookImage}
      />
      <div className={styles.wash} />
      <div className={styles.paper} />
      <div className={styles.vignette} />
    </div>
  );
}
