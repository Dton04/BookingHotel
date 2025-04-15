import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../css/navbar.css';

// Import hình ảnh icon
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

  // Hàm để kiểm tra trạng thái đăng nhập
  const checkLoginStatus = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    console.log('User Info from localStorage:', userInfo); // Debug line
    if (userInfo && userInfo.name) {
      setIsLoggedIn(true);
      setUser(userInfo); // Sử dụng trực tiếp object từ localStorage
      console.log('Set User State:', userInfo); // Debug line
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Kiểm tra lại trạng thái khi location thay đổi (để xử lý chuyển hướng)
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
    localStorage.removeItem('userInfo'); // Xóa thông tin người dùng
    setIsLoggedIn(false);
    setUser(null);
    // Chuyển hướng về trang chủ
    window.location.href = '/home';
  };

  return (
    <header className="header">
      <div className="top-bar">
        <h1 className="logo">HOTELIER</h1>
        <div className="top-bar-right d-flex align-items-center">
          <div className="contact-info d-none d-lg-flex">
            <span>
              <i className="fas fa-envelope"></i> info@example.com
            </span>
            <span>
              <i className="fas fa-phone"></i> +012 345 6789
            </span>
          </div>
          <div className="social-icons d-none d-md-flex">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
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
              <div class="dropdown">
              <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                {user.name}
              </button>
              <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li><Link class="dropdown-item" to="/bookings">Bookings</Link></li>
                {user && user.isAdmin && (
                  <>
                    <li>
                      <Link class="dropdown-item" to="/admin/staffmanagement">
                        <i class="fas fa-users-cog me-2"></i>Staff Management
                      </Link>
                    </li>
                    <li>
                      <Link class="dropdown-item" to="/admin/bookings">
                        <i class="fas fa-book me-2"></i>All Bookings
                      </Link>
                    </li>
                    <li>
                      <Link class="dropdown-item" to="/admin/users">
                        <i class="fas fa-user-cog me-2"></i>User Management
                      </Link>
                    </li>
                  </>
                )}
                <li><a class="dropdown-item" href="#" onClick={handleLogout}>Logout</a></li>
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

      <nav className="navbar navbar-expand-md">
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
          <div className="social-icons-mobile d-md-none mt-3 d-flex justify-content-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
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
        
        </div>
      </nav>
    </header>
  );
}

export default Navbar;