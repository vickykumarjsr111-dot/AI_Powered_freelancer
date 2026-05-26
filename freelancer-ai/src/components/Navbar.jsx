import { useState, useEffect } from "react";
import {
  ArrowRight,
  Zap,
  Shield,
  BarChart2,
  Clock,
  Star,
  Users,
  Menu,
  X,
} from "lucide-react";
import "./Navbar.css";

const features = [
  {
    icon: Zap,
    num: "01",
    title: "AI-Powered Matching",
    desc: "Our AI intelligently matches freelancers and clients based on skills, communication, and project fit.",
  },
  {
    icon: Shield,
    num: "02",
    title: "Verified Professionals",
    desc: "Every freelancer profile is verified for authenticity and professional credibility.",
  },
  {
    icon: BarChart2,
    num: "03",
    title: "Project Management",
    desc: "Manage tasks, milestones, chats, and invoices from one unified dashboard.",
  },
  {
    icon: Clock,
    num: "04",
    title: "Real-time Updates",
    desc: "Receive instant notifications for messages, approvals, and proposals.",
  },
  {
    icon: Star,
    num: "05",
    title: "Secure Payments",
    desc: "Escrow-backed payments ensure trust and security for both clients and freelancers.",
  },
  {
    icon: Users,
    num: "06",
    title: "Smart Recommendations",
    desc: "Our platform learns user preferences to improve recommendations over time.",
  },
];

const steps = [
  {
    num: "01",
    title: "Create Profile",
    desc: "Set up your freelancer or client profile with your preferences and skills.",
  },
  {
    num: "02",
    title: "Get Matched",
    desc: "Our AI suggests ideal projects or talent based on compatibility.",
  },
  {
    num: "03",
    title: "Start Working",
    desc: "Collaborate, communicate, and get paid through the platform.",
  },
];

const stats = [
  { value: "12K+", label: "Active Freelancers" },
  { value: "94%", label: "Match Satisfaction" },
  { value: "48h", label: "Avg. First Match" },
  { value: "$2.4M", label: "Paid Monthly" },
];

function SectionLabel({ text }) {
  return (
    <div className="section-label">
      <span className="section-line"></span>
      <span>{text}</span>
    </div>
  );
}

export default function Home({ onNavigateToLogin }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
        <nav className="nav container">
          <div className="logo">
            <img src="/image.png" alt="Logo" />
            <span className="logo-text">HustlanceAI</span>
          </div>

          <div className="desktop-nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
          </div>

          <div className="desktop-buttons">
            <button className="btn-secondary" onClick={onNavigateToLogin}>
              Login
            </button>
            <button className="btn-primary" onClick={onNavigateToLogin}>
              Get Started
            </button>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="mobile-menu">
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How It Works
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>
              Pricing
            </a>
            <button
              className="btn-secondary"
              onClick={() => {
                setMenuOpen(false);
                onNavigateToLogin();
              }}
            >
              Login
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setMenuOpen(false);
                onNavigateToLogin();
              }}
            >
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content container">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <span>AI-Powered Freelancing Platform</span>
          </div>

          <h1 className="hero-title">
            Find work
            <br />
            that fits
            <br />
            <span className="gradient-text">perfectly.</span>
          </h1>

          <p className="hero-description">
            Match with top freelancers or premium clients using intelligent AI
            recommendations built for modern freelancing.
          </p>

          <div className="hero-buttons">
            <button className="btn-cta" onClick={onNavigateToLogin}>
              Start for Free <ArrowRight size={18} />
            </button>
            <button className="btn-white" onClick={onNavigateToLogin}>
              See How It Works
            </button>
          </div>

          <div className="stats-row">
            {stats.map((stat, i) => (
              <div key={i} className="stat-box">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="features-section">
        <div className="container">
          <SectionLabel text="What we offer" />

          <h2 className="section-title">
            Built for the way
            <br />
            you actually work
          </h2>

          <div className="features-grid">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div className="feature-card" key={i}>
                  <span className="feature-number">{feature.num}</span>
                  <div className="feature-content">
                    <div className="feature-title-row">
                      <Icon size={16} />
                      <h3>{feature.title}</h3>
                    </div>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <SectionLabel text="Getting Started" />

          <h2 className="section-title">
            Three steps.
            <br />
            No nonsense.
          </h2>

          <div className="steps-grid">
            {steps.map((step, i) => (
              <div className="step-card" key={i}>
                <div className="step-number">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to stop searching endlessly?</h2>
            <p>
              Join thousands of freelancers and businesses already using
              HustlanceAI.
            </p>
            <button className="cta-button" onClick={onNavigateToLogin}>
              Join Now <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content container">
          <div className="footer-column">
            <div className="footer-logo">
              <img src="/image.png" alt="Logo" />
              <span className="logo-text">HustlanceAI</span>
            </div>
            <p className="footer-text">
              AI-powered freelancing platform connecting talent with opportunity.
            </p>
          </div>

          <div className="footer-columns-row">
            <div className="footer-column">
              <h4>Platform</h4>
              <a href="#">Find Work</a>
              <a href="#">Hire Talent</a>
              <a href="#">Pricing</a>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Contact</a>
              <a href="#">Blog</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}