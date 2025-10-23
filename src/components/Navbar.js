import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const activeTab = location.pathname;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" className="logo-link">
            <h1>truman</h1>
          </Link>
        </div>
        <div className="navbar-nav">
          <Link
            to="/"
            className={`navbar-item ${activeTab === '/' ? 'active' : ''}`}
          >
            About
          </Link>
          <Link
            to="/music"
            className={`navbar-item ${activeTab === '/music' ? 'active' : ''}`}
          >
            Music
          </Link>
          <Link
            to="/resume"
            className={`navbar-item ${activeTab === '/resume' ? 'active' : ''}`}
          >
            Resume
          </Link>
          <Link
            to="/contact"
            className={`navbar-item ${activeTab === '/contact' ? 'active' : ''}`}
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
