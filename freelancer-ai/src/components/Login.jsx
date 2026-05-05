import './Login.css';

export default function Login({ onBackToHome, onLogin }) {
  return (
    <div className="login-container">
      <button className="back-home-button" onClick={onBackToHome}>
        ← Back to Home
      </button>

      <div className="login-box">
        {/* Logo Section */}
        <div className="login-header">
          <div className="login-logo">
            <img src="/image.png" alt="Logo" />
            <span className="login-brand">HustlanceAI</span>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue to your account</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={onLogin}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" className="checkbox-input" />
              <span>Remember me</span>
            </label>
            <a href="#forgot" className="forgot-link">Forgot Password?</a>
          </div>

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>OR</span>
        </div>

        {/* Social Login */}
        <div className="social-login">
          <button type="button" className="social-button google" onClick={onLogin}>
            <span className="social-icon">G</span>
            Continue with Google
          </button>
          <button type="button" className="social-button github" onClick={onLogin}>
            <span className="social-icon">⚡</span>
            Continue with GitHub
          </button>
        </div>

        {/* Signup Link */}
        <div className="signup-link">
          Don't have an account? <a href="#signup">Sign Up</a>
        </div>
      </div>
    </div>
  );
}