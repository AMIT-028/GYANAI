import { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Features from "../components/Features";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import "../landing.css";

export default function LandingPage() {
  const [authType, setAuthType] = useState(null); // "login" | "signup"

  return (
    <div className="landing">
      <Navbar onLogin={onLogin} onSignup={onSignup} />
      <Hero />
      <About />
      <Features />
      <Footer />
    </div>
  );
}
