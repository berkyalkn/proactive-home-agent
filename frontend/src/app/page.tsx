"use client";

import { useState } from "react";
import "@/app/landing.css";

import Navbar from "@/components/landing/Navbar/Navbar";
import Footer from "@/components/landing/Footer/Footer";
import SplashScreen from "@/components/landing/SplashScreen/SplashScreen";
import WaitlistModal from "@/components/landing/WaitlistModal/WaitlistModal";
import HeroAnimation from "@/components/landing/sections/HeroAnimation";
import TransitionSection from "@/components/landing/sections/TransitionSection";
import FeatureCards from "@/components/landing/sections/FeatureCards";
import CTASection from "@/components/landing/sections/CTASection";

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="landing-scope">
      <SplashScreen />
      <Navbar />
      <HeroAnimation />
      <TransitionSection />
      <FeatureCards />
      <CTASection onOpenModal={() => setModalOpen(true)} />
      <Footer />
      <WaitlistModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}