"use client";

import { useRef, useEffect, useCallback } from "react";
import styles from "./HeroAnimation.module.css";

const imgOldMen = "/landing/images/smiling_old_men.png";
const imgOldWoman = "/landing/images/smiling_old_woman.png";
const imgRetriever = "/landing/images/smiling_golden_retriever.png";
const imgTeenager = "/landing/images/smiling_teenager.png";
const imgBaby = "/landing/images/smiling_baby.png";
const imgAdultMan = "/landing/images/smiling_adult_man.png";
const imgAdultWoman = "/landing/images/smiling_adult_woman.png";

const STONE_COUNT = 7;
const ANGLE_OFFSET = -90;
const BASE_RADIUS = 160;
const STONE_SIZES = [90, 110, 100, 120, 95, 115, 105];

const STONE_DATA = [
  {
    img: imgOldMen,
    alt: "Old Men",
    icon: "M12 2C6.477 2 2 6.145 2 11.243c0 2.904 1.175 5.425 3.204 7.19V22l3.727-2.044c1.076.304 2.18.463 3.069.463 5.523 0 10-4.144 10-9.243C22 6.145 17.523 2 12 2zm1.07 12.456l-2.547-2.72-4.97 2.72 5.465-5.804 2.61 2.72 4.907-2.72-5.465 5.804z",
  },
  {
    img: imgOldWoman,
    alt: "Old Woman",
    icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    img: imgRetriever,
    alt: "Golden Retriever",
    icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.016c-1.907-.001-3.78-.514-5.417-1.483l-.389-.231-4.03 1.057 1.076-3.93-.253-.403A9.728 9.728 0 011.67 12.06C1.672 6.335 6.326 1.683 12.06 1.683c2.77.001 5.373 1.08 7.328 3.037a10.285 10.285 0 013.034 7.332c-.003 5.725-4.656 10.377-10.381 10.377l.01.056zM20.52 3.449C18.247 1.226 15.235 0 12.05 0 5.463 0 .104 5.334.101 11.893c-.001 2.096.547 4.142 1.588 5.946L0 24l6.335-1.652A11.924 11.924 0 0012.035 24h.016c6.586 0 11.946-5.335 11.949-11.893.002-3.174-1.234-6.16-3.48-8.41z",
  },
  {
    img: imgTeenager,
    alt: "Teenager",
    icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    img: imgBaby,
    alt: "Baby",
    icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    img: imgAdultMan,
    alt: "Adult Man",
    icon: "M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2.235 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 00.497-3.753C20.18 7.773 21.692 5.25 22 4.009z",
  },
  {
    img: imgAdultWoman,
    alt: "Adult Woman",
    icon: "M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z",
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export default function HeroAnimation() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stoneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textMainRef = useRef<HTMLDivElement>(null);
  const textHomieeRef = useRef<HTMLDivElement>(null);
  const textConnectedRef = useRef<HTMLDivElement>(null);
  const wordYourRef = useRef<HTMLSpanElement>(null);
  const wordHomeRef = useRef<HTMLSpanElement>(null);
  const wordNeedsRef = useRef<HTMLSpanElement>(null);
  const wordLovedRef = useRef<HTMLSpanElement>(null);
  const wordRightContainerRef = useRef<HTMLDivElement>(null);

  const positionStones = useCallback((progress: number) => {
    let blurAmount: number, scaleMultiplier: number;

    if (progress < 0.2) {
      const t = progress / 0.2;
      blurAmount = lerp(25, 20, t);
      scaleMultiplier = lerp(1.6, 1.4, t);
    } else if (progress < 0.4) {
      const t = (progress - 0.2) / 0.2;
      blurAmount = lerp(20, 0, t);
      scaleMultiplier = lerp(1.4, 0.85, t);
    } else if (progress < 0.6) {
      const t = (progress - 0.4) / 0.2;
      blurAmount = 0;
      scaleMultiplier = lerp(0.85, 0.9, t);
    } else if (progress < 0.8) {
      const t = (progress - 0.6) / 0.2;
      blurAmount = lerp(0, 25, t);
      scaleMultiplier = lerp(0.9, 1.6, t);
    } else {
      blurAmount = 25;
      const t = (progress - 0.8) / 0.2;
      scaleMultiplier = lerp(1.6, 1.8, t);
    }

    const rotation = progress * 30;

    stoneRefs.current.forEach((stone, i) => {
      if (!stone) return;
      const angle = (360 / STONE_COUNT) * i + ANGLE_OFFSET + rotation;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * BASE_RADIUS;
      const y = Math.sin(rad) * BASE_RADIUS;
      const size = STONE_SIZES[i] * scaleMultiplier;

      stone.style.width = size + "px";
      stone.style.height = size + "px";
      stone.style.left = `calc(50% + ${x}px - ${size / 2}px)`;
      stone.style.top = `calc(50% + ${y}px - ${size / 2}px)`;
      stone.style.filter = `blur(${blurAmount}px)`;
    });

    const viewport = viewportRef.current;
    if (viewport) {
      if (progress > 0.85) {
        const fadeT = (progress - 0.85) / 0.15;
        viewport.style.opacity = String(lerp(1, 0, fadeT));
      } else {
        viewport.style.opacity = "1";
      }
    }
  }, []);

  const updateLayers = useCallback((progress: number) => {
    stoneRefs.current.forEach((stone) => {
      if (!stone) return;
      const blob = stone.querySelector<HTMLElement>('[data-layer="blob"]');
      const icon = stone.querySelector<HTMLElement>('[data-layer="icon"]');
      const photo = stone.querySelector<HTMLElement>('[data-layer="photo"]');
      if (!blob || !icon || !photo) return;

      if (progress < 0.15) {
        blob.style.opacity = "1";
        icon.style.opacity = "0";
        photo.style.opacity = "0";
        photo.classList.remove(styles.stonePhotoActive);
      } else if (progress < 0.25) {
        const t = (progress - 0.15) / 0.1;
        blob.style.opacity = "1";
        icon.style.opacity = String(t);
        photo.style.opacity = "0";
        photo.classList.remove(styles.stonePhotoActive);
      } else if (progress < 0.35) {
        blob.style.opacity = "1";
        icon.style.opacity = "1";
        photo.style.opacity = "0";
        photo.classList.remove(styles.stonePhotoActive);
      } else if (progress < 0.45) {
        const t = (progress - 0.35) / 0.1;
        blob.style.opacity = String(lerp(1, 0, t));
        icon.style.opacity = String(lerp(1, 0, t));
        photo.style.opacity = String(t);
        if (t > 0.5) photo.classList.add(styles.stonePhotoActive);
      } else if (progress < 0.6) {
        blob.style.opacity = "0";
        icon.style.opacity = "0";
        photo.style.opacity = "1";
        photo.classList.add(styles.stonePhotoActive);
      } else if (progress < 0.7) {
        const t = (progress - 0.6) / 0.1;
        blob.style.opacity = String(t);
        icon.style.opacity = "0";
        photo.style.opacity = String(lerp(1, 0, t));
        if (t > 0.5) photo.classList.remove(styles.stonePhotoActive);
      } else {
        blob.style.opacity = "1";
        icon.style.opacity = "0";
        photo.style.opacity = "0";
        photo.classList.remove(styles.stonePhotoActive);
      }
    });
  }, []);

  const updateText = useCallback((progress: number) => {
    const vw = window.innerWidth;
    let spreadX = 0;
    const wordYour = wordYourRef.current;
    const wordHome = wordHomeRef.current;
    const wordNeeds = wordNeedsRef.current;
    const wordLoved = wordLovedRef.current;
    const textMain = textMainRef.current;
    const textConnected = textConnectedRef.current;
    const textHomiee = textHomieeRef.current;
    const wordRightContainer = wordRightContainerRef.current;

    if (!wordYour || !textMain || !textHomiee || !textConnected) return;

    textHomiee.style.opacity = "0";
    textHomiee.style.visibility = "hidden";
    textConnected.style.opacity = "0";
    textConnected.style.visibility = "hidden";
    if (wordHome) wordHome.style.opacity = "0";
    if (wordNeeds) wordNeeds.style.opacity = "0";
    if (wordLoved) wordLoved.style.opacity = "0";

    if (progress < 0.1) {
      textMain.style.opacity = "1";
      if (wordHome) wordHome.style.opacity = "1";
      spreadX = 0;
    } else if (progress < 0.25) {
      textMain.style.opacity = "1";
      if (wordHome) wordHome.style.opacity = "1";
      const t = (progress - 0.1) / 0.15;
      spreadX = t * vw * 0.25;
    } else if (progress < 0.32) {
      textMain.style.opacity = "1";
      spreadX = vw * 0.25;
      const t = (progress - 0.25) / 0.07;
      if (t < 0.5) {
        if (wordHome) wordHome.style.opacity = String(lerp(1, 0, t * 2));
      } else {
        if (wordNeeds)
          wordNeeds.style.opacity = String(lerp(0, 1, (t - 0.5) * 2));
      }
    } else if (progress < 0.44) {
      textMain.style.opacity = "1";
      if (wordNeeds) wordNeeds.style.opacity = "1";
      spreadX = vw * 0.25;
    } else if (progress < 0.51) {
      textMain.style.opacity = "1";
      spreadX = vw * 0.25;
      const t = (progress - 0.44) / 0.07;
      if (t < 0.5) {
        if (wordNeeds)
          wordNeeds.style.opacity = String(lerp(1, 0, t * 2));
      } else {
        if (wordLoved)
          wordLoved.style.opacity = String(lerp(0, 1, (t - 0.5) * 2));
      }
    } else if (progress < 0.63) {
      textMain.style.opacity = "1";
      if (wordLoved) wordLoved.style.opacity = "1";
      spreadX = vw * 0.25;
    } else if (progress < 0.72) {
      const t = (progress - 0.63) / 0.09;
      if (t < 0.5) {
        const fadeOut = t / 0.5;
        textMain.style.opacity = String(lerp(1, 0, fadeOut));
        if (wordLoved) wordLoved.style.opacity = "1";
        spreadX = lerp(vw * 0.25, vw * 0.1, fadeOut);
      } else {
        const fadeIn = (t - 0.5) / 0.5;
        textMain.style.opacity = "0";
        textConnected.style.visibility = "visible";
        textConnected.style.opacity = String(lerp(0, 1, fadeIn));
        spreadX = 0;
      }
    } else if (progress < 0.81) {
      textMain.style.opacity = "0";
      textConnected.style.visibility = "visible";
      textConnected.style.opacity = "1";
    } else if (progress < 0.9) {
      const t = (progress - 0.81) / 0.09;
      if (t < 0.5) {
        const fadeOut = t / 0.5;
        textConnected.style.visibility = "visible";
        textConnected.style.opacity = String(lerp(1, 0, fadeOut));
      } else {
        const fadeIn = (t - 0.5) / 0.5;
        textHomiee.style.visibility = "visible";
        textHomiee.style.opacity = String(lerp(0, 1, fadeIn));
      }
    } else {
      textMain.style.opacity = "0";
      textHomiee.style.visibility = "visible";
      textHomiee.style.opacity = "1";
    }

    wordYour.style.transform = `translateX(${-spreadX}px)`;
    if (wordRightContainer)
      wordRightContainer.style.transform = `translateX(${spreadX}px)`;
  }, []);

  const updateAnimation = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const scrollDistance = wrapper.offsetHeight - window.innerHeight;
    const rawProgress = -rect.top / scrollDistance;
    const progress = Math.max(0, Math.min(1, rawProgress));

    positionStones(progress);
    updateText(progress);
    updateLayers(progress);
  }, [positionStones, updateText, updateLayers]);

  useEffect(() => {
    updateAnimation();
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateAnimation();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [updateAnimation]);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.stoneContainer}>
          {STONE_DATA.map((data, i) => (
            <div
              key={i}
              className={styles.stone}
              ref={(el) => {
                stoneRefs.current[i] = el;
              }}
            >
              <div className={styles.stoneBlob} data-layer="blob" />
              <div className={styles.stoneIcon} data-layer="icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d={data.icon} />
                </svg>
              </div>
              <div className={styles.stonePhoto} data-layer="photo">
                <img
                  src={data.img}
                  alt={data.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.textOverlay}>
          <div className={styles.textMain} ref={textMainRef}>
            <span className={styles.scrollWord} ref={wordYourRef}>
              Your
            </span>
            <div
              className={styles.wordRightContainer}
              ref={wordRightContainerRef}
            >
              <span
                className={`${styles.scrollWord} ${styles.wordRight}`}
                ref={wordHomeRef}
              >
                Home
              </span>
              <span
                className={`${styles.scrollWord} ${styles.wordRight} ${styles.wordRightAbsolute}`}
                ref={wordNeedsRef}
              >
                Needs
              </span>
              <span
                className={`${styles.scrollWord} ${styles.wordRight} ${styles.wordRightAbsolute}`}
                ref={wordLovedRef}
              >
                beloved ones
              </span>
            </div>
          </div>
          <div className={styles.textConnected} ref={textConnectedRef}>
            <span className={`${styles.scrollWord} ${styles.wordSolo}`}>
              Connected
            </span>
          </div>
          <div className={styles.textHomiee} ref={textHomieeRef}>
            <span className={`${styles.scrollWord} ${styles.wordSolo}`}>
              HOMIEE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
