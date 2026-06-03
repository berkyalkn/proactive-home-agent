"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "@/app/landing.css";

import Navbar from "@/components/landing/Navbar/Navbar";
import Footer from "@/components/landing/Footer/Footer";
import WaitlistModal from "@/components/landing/WaitlistModal/WaitlistModal";
import styles from "./Story.module.css";

const imgHub = "/landing/images/homiee_hub.jpg";

function useScrollAnim() {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

interface HighlightProps {
  color: string;
  children: React.ReactNode;
  inView: boolean;
}

function Highlight({ color, children, inView }: HighlightProps) {
  return (
    <span
      className={`${styles.highlight} ${inView ? styles.highlightVisible : ""}`}
      style={{ "--highlight-color": color } as React.CSSProperties}
    >
      {children}
    </span>
  );
}

interface NarrativeBlockProps {
  children: ((inView: boolean) => React.ReactNode) | React.ReactNode;
}

function NarrativeBlock({ children }: NarrativeBlockProps) {
  const { ref, inView } = useScrollAnim();
  return (
    <div
      className={styles.narrativeBlock}
      ref={ref as React.RefObject<HTMLDivElement>}
    >
      {typeof children === "function" ? children(inView) : children}
    </div>
  );
}

export default function Story() {
  const [modalOpen, setModalOpen] = useState(false);

  const intro = useScrollAnim();
  const device = useScrollAnim();
  const cta = useScrollAnim();

  return (
    <div className="landing-scope">
      <div className={styles.storyPage}>
        <Navbar />

        <main className={styles.main}>
          {/* Hero */}
          <section className={styles.heroWrapper}>
            <div className={styles.hero}>
              <div className={styles.meshBg} />
              <div className={styles.dotGrid} />
              <h1 className={styles.heroTitle}>Our Story</h1>
            </div>
          </section>

          {/* Intro */}
          <section
            className={`${styles.intro} ${styles.scrollAnimItem} ${styles.slideY} ${intro.inView ? styles.inView : ""}`}
            ref={intro.ref as React.RefObject<HTMLElement>}
          >
            <p>
              Safety and peace of mind are fundamental human needs. From the very
              first shelters to modern architecture, the true purpose of a home
              has always been to create a space where we feel completely secure.
              Our real power lies in how we manage and protect that space.
            </p>
          </section>

          {/* Narrative */}
          <section className={styles.narrativeContainer}>
            <div className={styles.narrativeLeft}>
              <div
                className={`${styles.deviceMockup} ${styles.scrollAnimItem} ${styles.slideXLeft} ${device.inView ? styles.inView : ""}`}
                ref={device.ref as React.RefObject<HTMLDivElement>}
              >
                <img
                  src={imgHub}
                  alt="HOMIEE Smart Hub Device"
                  className={styles.deviceImg}
                />
              </div>
            </div>

            <div className={styles.narrativeRight}>
              <NarrativeBlock>
                {(inView: boolean) => (
                  <>
                    <p>
                      For AI to genuinely support us at home, it must understand
                      our context: when we need help, when we need quiet, and
                      when unexpected dangers arise.
                    </p>
                    <p className={styles.mt4}>
                      When we looked at the market, we saw a massive void.
                      Today&apos;s smart homes are little more than digital
                      remote controls. There was no truly{" "}
                      <Highlight color="#baa8c3" inView={inView}>
                        agentic platform
                      </Highlight>{" "}
                      that could make proactive decisions for you while keeping
                      all that intelligence safely within the home.
                    </p>
                  </>
                )}
              </NarrativeBlock>

              <NarrativeBlock>
                {(inView: boolean) => (
                  <>
                    <p>
                      What happens inside your home is your most deeply{" "}
                      <Highlight color="#d2aebf" inView={inView}>
                        personal
                      </Highlight>{" "}
                      data.
                    </p>
                    <p className={styles.mt8}>
                      You don&apos;t want to stream footage of your living room,
                      your family, and your most vulnerable moments to the cloud
                      servers of big tech companies, and you shouldn&apos;t.
                    </p>
                  </>
                )}
              </NarrativeBlock>

              <NarrativeBlock>
                {(inView: boolean) => (
                  <>
                    <p>
                      At{" "}
                      <Highlight color="#acb2cc" inView={inView}>
                        HOMIEE
                      </Highlight>
                      , we&apos;re building the most proactive, the safest, and
                      the most private smart home agent.
                    </p>
                    <br />
                    <p className={styles.mt8}>
                      HOMIEE is driven by{" "}
                      <Highlight color="#baa8c3" inView={inView}>
                        advanced fall
                      </Highlight>{" "}
                      and gesture detection, designed specifically to protect you
                      during critical moments. By deeply understanding your
                      physical movements and the context of your home, HOMIEE
                      acts as a true agent in emergencies.
                    </p>
                    <br />
                    <p className={styles.mt8}>
                      It recognizes a sudden fall instantly or interprets a
                      specific gesture as a silent SOS, taking the initiative to
                      trigger immediate, life-saving action without you ever
                      needing to speak a word.
                    </p>
                    <br />
                    <p className={`${styles.mt8} ${styles.whiteText}`}>
                      Proactive intelligence, life-saving safety AND absolute
                      privacy.
                    </p>
                    <br />
                    <p className={styles.mt8}>
                      It&apos;s possible, and our mission is to bring it to
                      every home.
                    </p>
                  </>
                )}
              </NarrativeBlock>
            </div>
          </section>

          {/* CTA */}
          <section
            className={`${styles.ctaWrapper} ${styles.scrollAnimItem} ${styles.slideY} ${cta.inView ? styles.inView : ""}`}
            ref={cta.ref as React.RefObject<HTMLElement>}
          >
            <div className={styles.ctaCard}>
              <h2>A home that finally looks out for you.</h2>
              <p className={styles.ctaSubtitle}>Reserve your peace of mind.</p>
              <button
                className={styles.ctaBtn}
                onClick={() => setModalOpen(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                Join the waitlist
              </button>
            </div>
          </section>
        </main>

        <Footer />
        <WaitlistModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </div>
  );
}
