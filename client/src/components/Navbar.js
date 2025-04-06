import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/navbar.css';

function Navbar() {
  const location = useLocation();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <header className="header">
      <div className="top-bar">
        <h1 className="logo">HOTELIER</h1>
        <div className="contact-info">
          <span>info@example.com</span>
          <span>+012 345 6789</span>
        </div>
      </div>

      <nav className="navbar navbar-expand-lg">
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mr-auto">
            <li className={`nav-item ${['/home', '/'].includes(location.pathname) ? 'active' : ''}`}>
              <Link className="nav-link" to="/home">HOME</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
              <Link className="nav-link" to="/about">ABOUT</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/services' ? 'active' : ''}`}>
              <Link className="nav-link" to="/services">SERVICES</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/rooms' ? 'active' : ''}`}>
              <Link className="nav-link" to="/rooms">ROOMS</Link>
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
                  <Link className="dropdown-item" to="/book" onClick={closeDropdown}>Booking</Link>
                  <Link className="dropdown-item" to="/ourteam" onClick={closeDropdown}>Our Team</Link>
                  <Link className="dropdown-item" to="/testimonial" onClick={closeDropdown}>Testimonial</Link>
                </div>
              )}
            </li>

            <li className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}>
              <Link className="nav-link" to="/contact">CONTACT</Link>
            </li>
          </ul>

          <div className="premium-button">
            <Link to="/premium" className="btn btn-premium">PREMIUM VERSION</Link>
          </div>
        </div>
      </nav>

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
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
          <i className="fab fa-youtube"></i>
        </a>
      </div>
    </header>
  );
}

export default Navbar;
