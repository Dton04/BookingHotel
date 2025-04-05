import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

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
            <li className={`nav-item ${location.pathname === '/home' ? 'active' : ''}`}>
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
            <li className={`nav-item dropdown ${location.pathname.startsWith('/pages') ? 'active' : ''}`}>
              <Link className="nav-link dropdown-toggle" to="/pages" id="pagesDropdown" data-toggle="dropdown">
                PAGES
              </Link>
              <div className="dropdown-menu" aria-labelledby="pagesDropdown">
                <Link className="dropdown-item" to="/pages/page1">Page 1</Link>
                <Link className="dropdown-item" to="/pages/page2">Page 2</Link>
              </div>
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
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
      </div>
    </header>
  );
}

export default Navbar;