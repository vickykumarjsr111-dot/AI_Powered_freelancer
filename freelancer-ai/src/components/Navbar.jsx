import './Navbar.css';

export default function Home({ onNavigateToLogin }) {
  return (
    <div className="home-container">
      <header className="header">
        <nav className="nav container">
          <div className="logo">
            <span className="logo-icon"><img src="/image.png" alt="Logo" /></span>
            <span className="logo-text">HustlanceAI</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <button className="btn-secondary" onClick={onNavigateToLogin}>Login</button>
            <button className="btn-primary" onClick={onNavigateToLogin}>Get Started</button>
          </div>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content container">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            <span>AI-Powered Matching Technology</span>
          </div>

          <h1 className="hero-title">
            Find Your Perfect <br />
            <span className="gradient-text">Freelance Match</span>
          </h1>

          <p className="hero-description">
            Connect with top talent or discover your next opportunity. Our AI-powered platform matches freelancers
            with clients based on skills, project requirements, and preferences.
          </p>

          <div className="hero-buttons">
            <button className="btn-cta" onClick={onNavigateToLogin}>
              Start as Freelancer <span className="btn-icon">→</span>
            </button>
            <button className="btn-white" onClick={onNavigateToLogin}>Hire Talent</button>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-subtitle">
              Everything you need to succeed in the freelance marketplace
            </p>
          </div>

          <div className="features-grid">
            {[
              ["🧠", "AI-Powered Matching"],
              ["👥", "Verified Professionals"],
              ["💼", "Project Management"],
              ["⚡", "Real-time Updates"],
              ["✅", "Secure Payments"],
              ["✨", "Smart Recommendations"]
            ].map((item, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">{item[0]}</div>
                <h3 className="feature-title">{item[1]}</h3>
                <p className="feature-description">
                  High-quality system designed for modern freelancing workflows.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get started in three simple steps</p>
          </div>

          <div className="steps-grid">
            {["Create Profile", "Get Matched", "Start Working"].map((step, i) => (
              <div className="step" key={i}>
                <div className="step-number">{i + 1}</div>
                <h3 className="step-title">{step}</h3>
                <p className="step-description">
                  Seamless onboarding and intelligent automation.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-description">
              Join thousands of freelancers and clients today.
            </p>
            <button className="cta-button" onClick={onNavigateToLogin}>Join Now - It's Free</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content container">
          <div className="footer-column">
            <div className="footer-logo">
              <span className="logo-icon"><img src="/image.png" alt="Logo" /></span>
              <span className="logo-text">HustlanceAI</span>
            </div>
            <p className="footer-text">
              AI-powered freelancing platform connecting talent with opportunity.
            </p>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><a href="#">Find Work</a></li>
              <li><a href="#">Hire Talent</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 HustlanceAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
