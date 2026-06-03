"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./FeatureCards.module.css";

const imgPrivacy = "/landing/images/proactive_privacy.png";
const imgNLP = "/landing/images/natural_language_control.png";
const imgGesture = "/landing/images/gesture_sos_trigger_natural.png";
const imgFall = "/landing/images/fall_detected_natural.png";

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
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
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, className: `fadeIn ${visible ? "visible" : ""}` };
}

export default function FeatureCards() {
  const privacy = useFadeIn();
  const grid = useFadeIn();
  const stack = useFadeIn();

  return (
    <section className={styles.section} id="features">
      <div className="container">
        {/* Proactive Privacy */}
        <div
          className={`${styles.featureLarge} ${styles.fullBgCard} ${privacy.className}`}
          ref={privacy.ref}
          id="unified-inbox"
        >
          <div className={styles.featureContent}>
            <h4>Fully Local, On Device</h4>
            <p>
              Meet HOMIEE: A proactive smart home system that manages your
              devices, catches sudden falls, and responds to emergency gestures.
              Because we value your privacy, all of this power stays strictly
              within your walls. HOMIEE&apos;s entire logic and vision
              processing run exclusively on your local hardware. No uploaded
              video feeds, no cloud dependencies. Just absolute peace of mind.
            </p>
          </div>
          <div className={styles.featureImage}>
            <img
              src={imgPrivacy}
              alt="Proactive privacy and local processing"
              loading="lazy"
            />
          </div>
        </div>

        {/* NLP + AI Cards */}
        <div className={`${styles.grid2} ${grid.className}`} ref={grid.ref}>
          <div
            className={`${styles.featureCard} ${styles.nlpCard}`}
            id="nlp-feature"
          >
            <div className={styles.cardContent}>
              <h4>Natural Language Control</h4>
              <p>
                Manage your entire home through natural language. Whether you
                send a quick text or speak across the room, the agentic AI
                understands your intent and executes every function flawlessly.
              </p>
            </div>
            <div className={styles.cardVisual}>
              <img
                src={imgNLP}
                alt="Natural Language Control"
                loading="lazy"
              />
            </div>
          </div>

          <div
            className={`${styles.featureCard} ${styles.aiCard}`}
            id="ai-feature"
          >
            <div className={styles.cardContent}>
              <h4>Context Aware. Proactively Yours.</h4>
              <p>
                It doesn&apos;t just wait for commands; it observes. By
                understanding the time, your habits, and the context of your
                space, the agent proactively adjusts your environment before you
                even realize you need it.
              </p>
            </div>
            <div className={styles.intelligenceGlow} />
          </div>
        </div>

        {/* Gesture SOS + Fall Detection */}
        <div
          className={`${styles.verticalStack} ${stack.className}`}
          ref={stack.ref}
        >
          <div
            className={`${styles.featureLarge} ${styles.fullBgCard}`}
            id="stacked-card-1"
          >
            <div className={styles.featureContent}>
              <h4>Signal for Help. Without a Word.</h4>
              <p>
                Assign a specific custom gesture as your personal SOS trigger.
                In an emergency, a single intentional gesture instantly alerts
                your designated contact via an automated phone call, SMS, and
                Telegram message.
              </p>
            </div>
            <div className={styles.featureImage}>
              <img
                src={imgGesture}
                alt="Gesture SOS trigger"
                loading="lazy"
              />
            </div>
          </div>

          <div
            className={`${styles.featureLarge} ${styles.fullBgCard}`}
            id="stacked-card-2"
          >
            <div className={styles.featureContent}>
              <h4>Absolute Safety.</h4>
              <p>
                If a sudden fall occurs, the agent takes over. It autonomously
                activates the exact same SOS protocol, ensuring your beloved
                ones are safe, completely hands-free.
              </p>
            </div>
            <div className={styles.featureImage}>
              <img
                src={imgFall}
                alt="Fall detection autonomous SOS"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
