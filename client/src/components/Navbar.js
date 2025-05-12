import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/navbar.css';

// Import icons
import facebookIcon from '../assets/icons/facebook-icon.jpg';
import twitterIcon from '../assets/icons/x-icon.jpg';
import instagramIcon from '../assets/icons/instagram-icon.png';
import youtubeIcon from '../assets/icons/youtube-icon.jpg';

function Navbar() {
  const location = useLocation();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNavOpen, setNavOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const checkLoginStatus = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    console.log('User Info from localStorage:', userInfo);
    if (userInfo && userInfo.name) {
      setIsLoggedIn(true);
      setUser(userInfo);
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [location]);

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

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = '/home';
  };

  return (
    <header className="header">
      <div className="top-bar">
        <h1 className="logo">HOTELIER</h1>
        <div className="top-bar-right d-flex align-items-center">
          <div className="contact-info d-none d-lg-flex">
            <span>
              <i className="fas fa-envelope"></i> Hotelier@gmail.com
            </span>
            <span>
              <i className="fas fa-phone"></i> 0869708914
            </span>
          </div>
          <div className="social-icons d-none d-md-flex">
            <a href="https://facebook.com/tandat0811" target="_blank" rel="noopener noreferrer">
              <img src={facebookIcon} alt="Facebook" className="social-icon-img" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <img src={twitterIcon} alt="Twitter" className="social-icon-img" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <img src={instagramIcon} alt="Instagram" className="social-icon-img" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
              <img src={youtubeIcon} alt="YouTube" className="social-icon-img" />
            </a>
          </div>
          <div className="auth-buttons d-none d-md-flex">
            {isLoggedIn ? (
              <div className="dropdown">
                <button
                  className="btn btn-secondary dropdown-toggle"
                  type="button"
                  id="dropdownMenuButton1"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {user.name}
                </button>
                <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                  {user.role === 'admin' ? (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/admin/dashboard">
                          <i className="fas fa-tachometer-alt me-2"></i>Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/staffmanagement">
                          <i className="fas fa-users-cog me-2"></i>Staff Management
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/bookings">
                          <i className="fas fa-book me-2"></i>All Bookings
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/users">
                          <i className="fas fa-user-cog me-2"></i>User Management
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/createroom">
                          <i className="fas fa-plus me-2"></i>Tạo Phòng Mới
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/rooms">
                          <i className="fas fa-bed me-2"></i>Quản Lý Phòng
                        </Link>
                      </li>

                      <li>
                        <Link className="dropdown-item" to="/admin/createhotel">
                          <i className="fas fa-hotel me-2"></i>Tạo Khách Sạn Mới
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/hotels">
                          <i className="fas fa-hotel me-2"></i>Quản Lý Khách Sạn
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/reviews">
                          <i className="fas fa-star me-2"></i>Quản Lý Đánh Giá
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/vouchers">
                          <i className="fas fa-ticket-alt me-2"></i>Quản Lý Khuyến Mãi
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/admin/discounts">
                          <i className="fas fa-bed me-2"></i>Quản Lý Khuyến Mãi
                        </Link>
                      </li>
                    </>
                  ) : user.role === 'staff' ? (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/admin/users">
                          <i className="fas fa-user-cog me-2"></i>User Management
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/stats">
                          Thống Kê
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link className="dropdown-item" to="/bookings">
                          Bookings
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/stats">
                          Thống Kê
                        </Link>
                      </li>
                    </>
                  )}


                  {/* Thêm liên kết Membership và Profile cho tất cả role */}
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/membership"
                      onClick={() => {
                        closeDropdown();
                        closeNav();
                      }}
                    >
                      <i className="fas fa-star me-2"></i>Membership
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="dropdown-item"
                      to="/profile"
                      onClick={() => {
                        closeDropdown();
                        closeNav();
                      }}
                    >
                      <i className="fas fa-user me-2"></i>Profile
                    </Link>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>Logout
                    </a>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary btn-sm me-2">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            )}
          </div>
          <button
            className="navbar-toggler d-md-none"
            type="button"
            onClick={toggleNav}
            aria-controls="navbarNav"
            aria-expanded={isNavOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon">☰</span>
          </button>
        </div>
      </div>

      <nav className="navbar navbar-expand-md">
        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav">
            <li className={`nav-item ${['/home', '/'].includes(location.pathname) ? 'active' : ''}`}>
              <Link className="nav-link" to="/home" onClick={closeNav}>
                HOME
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
              <Link className="nav-link" to="/about" onClick={closeNav}>
                ABOUT
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/services' ? 'active' : ''}`}>
              <Link className="nav-link" to="/services" onClick={closeNav}>
                SERVICES
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/hotels' ? 'active' : ''}`}>
              <Link className="nav-link" to="/hotels" onClick={closeNav}>
                ROOMS
              </Link>
            </li>
            <li
              className={`nav-item dropdown ${['/book', '/ourteam', '/testimonial'].includes(location.pathname) ? 'active' : ''}`}
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
                  <Link
                    className="dropdown-item"
                    to="/ourteam"
                    onClick={() => {
                      closeDropdown();
                      closeNav();
                    }}
                  >
                    Our Team
                  </Link>
                  <Link
                    className="dropdown-item"
                    to="/testimonial"
                    onClick={() => {
                      closeDropdown();
                      closeNav();
                    }}
                  >
                    Testimonials
                  </Link>
                </div>
              )}
            </li>
            <li className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}>
              <Link className="nav-link" to="/contact" onClick={closeNav}>
                CONTACT
              </Link>
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