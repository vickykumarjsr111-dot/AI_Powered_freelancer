import React from "react";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="logo">
        <span className="logo-icon">◆</span>
        <span className="logo-text"></span>
      </div>

      {/* Center Menu */}
      <div className="nav-links">
        <a href="#" className="active">Home</a>
        <a href="#">About Us</a>
        <a href="#">Features</a>
        <a href="#">Articles</a>
      </div>

      {/* Right Section */}
      <div className="nav-actions">
        <div className="icons">
          <span className="icon">⌕</span>
          <span className="icon">✕</span>
          <span className="icon">⚙</span>
        </div>

        <button className="btn">Get Started</button>
      </div>
    </nav>
  );
}