"use client";

import { useState, useEffect } from "react";
import styles from "./SplashScreen.module.css";

export default function SplashScreen() {
  const [assembled, setAssembled] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    document.body.classList.add("splashActive");

    const t1 = setTimeout(() => setAssembled(true), 1200);
    const t2 = setTimeout(() => {
      setFadeOut(true);
      document.body.classList.remove("splashActive");
    }, 4800);
    const t3 = setTimeout(() => setRemoved(true), 5800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (removed) return null;

  return (
    <div className={`${styles.splash} ${fadeOut ? styles.fadeOut : ""}`}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <svg
            className={`${styles.dots} ${assembled ? styles.assembled : ""}`}
            viewBox="0 0 120 120"
            fill="none"
          >
            <circle
              className={`${styles.dot} ${styles.dot1}`}
              cx="60"
              cy="18"
              r="10"
              fill="#c4a8e0"
            />
            <circle
              className={`${styles.dot} ${styles.dot2}`}
              cx="96"
              cy="36"
              r="11"
              fill="#d4b8e8"
            />
            <circle
              className={`${styles.dot} ${styles.dot3}`}
              cx="102"
              cy="72"
              r="10"
              fill="#c8a0d8"
            />
            <circle
              className={`${styles.dot} ${styles.dot4}`}
              cx="78"
              cy="102"
              r="11"
              fill="#d0b0e0"
            />
            <circle
              className={`${styles.dot} ${styles.dot5}`}
              cx="42"
              cy="102"
              r="10"
              fill="#c0a0d0"
            />
            <circle
              className={`${styles.dot} ${styles.dot6}`}
              cx="18"
              cy="72"
              r="11"
              fill="#d8c0e8"
            />
            <circle
              className={`${styles.dot} ${styles.dot7}`}
              cx="24"
              cy="36"
              r="10"
              fill="#c4a8e0"
            />
          </svg>
        </div>
        <span
          className={`${styles.wordmark} ${assembled ? styles.showWordmark : ""}`}
        >
          HOMIEE
        </span>
      </div>
    </div>
  );
}
