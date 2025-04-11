import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/navbar.css';

function Navbar() {
  const location = useLocation();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNavOpen, setNavOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const toggleNav = () => {
    setNavOpen(!isNavOpen);
  };

  const closeNav = () => {
    setNavOpen(false);
    setDropdownOpen(false);
  };

  return (
    <header className="header">
      <div className="top-bar">
        <h1 className="logo">HOTELIER</h1>
        <div className="contact-info">
          <span>
            <i className="fas fa-envelope"></i> info@example.com
          </span>
          <span>
            <i className="fas fa-phone"></i> +012 345 6789
          </span>
        </div>
        <div className="social-icons">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-linkedin-in"></i>
          </a>
        </div>
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleNav}
          aria-controls="navbarNav"
          aria-expanded={isNavOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon">☰</span>
        </button>
      </div>

      <nav className="navbar navbar-expand-lg">
        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav">
            <li className={`nav-item ${['/home', '/'].includes(location.pathname) ? 'active' : ''}`}>
              <Link className="nav-link" to="/home" onClick={closeNav}>HOME</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
              <Link className="nav-link" to="/about" onClick={closeNav}>ABOUT</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/services' ? 'active' : ''}`}>
              <Link className="nav-link" to="/services" onClick={closeNav}>SERVICES</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/rooms' ? 'active' : ''}`}>
              <Link className="nav-link" to="/rooms" onClick={closeNav}>ROOMS</Link>
            </li>

            {/* Dropdown PAGES */}
            <li
              className={`nav-item dropdown ${
                ['/book', '/ourteam', '/testimonial'].includes(location.pathname) ? 'active' : ''
              }`}
              onMouseLeave={closeDropdown}
            >
              <span
                className="nav-link dropdown-toggle"
                role="button"
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
                style={{ cursor: 'pointer' }}
              >
                PAGES
              </span>

              {isDropdownOpen && (
                <div className="dropdown-menu show" aria-labelledby="pagesDropdown">
                  <Link className="dropdown-item" to="/book" onClick={() => { closeDropdown(); closeNav(); }}>
                    Booking
                  </Link>
                  <Link className="dropdown-item" to="/ourteam" onClick={() => { closeDropdown(); closeNav(); }}>
                    Our Team
                  </Link>
                  <Link className="dropdown-item" to="/testimonial" onClick={() => { closeDropdown(); closeNav(); }}>
                    Testimonial
                  </Link>
                </div>
              )}
            </li>

            <li className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}>
              <Link className="nav-link" to="/contact" onClick={closeNav}>CONTACT</Link>
            </li>
          </ul>

          <div className="premium-button">
            <Link to="/premium" className="btn btn-premium" onClick={closeNav}>
              PREMIUM VERSION <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;