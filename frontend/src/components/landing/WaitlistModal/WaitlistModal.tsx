"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./WaitlistModal.module.css";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.active : ""}`}
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3>Join the waitlist</h3>
        <p>Be the first to know when HOMIEE becomes available.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="email"
            className={styles.input}
            placeholder="Email address"
            required
            disabled={submitted}
          />
          <button
            type="submit"
            className={styles.submit}
            style={
              submitted ? { background: "#4ade80", color: "#000" } : undefined
            }
          >
            {submitted ? "Joined! ✓" : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
