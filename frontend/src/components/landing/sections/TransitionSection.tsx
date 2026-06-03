"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./TransitionSection.module.css";

export default function TransitionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`${styles.section} fadeIn ${visible ? "visible" : ""}`}
      ref={sectionRef}
      id="transition"
    >
      <div className="container">
        <h2 className={styles.heading}>
          It thinks.
          <br />
          So you don&apos;t have to.
        </h2>
        <p className={styles.text}>
          Wave for immediate help, ensure sudden falls never go unnoticed,
          <br />
          and let an agentic mind analyze your safety in real-time.
        </p>
      </div>
    </section>
  );
}
