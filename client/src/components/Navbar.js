// Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../css/navbar.css';
import axios from 'axios';

import facebookIcon from '../assets/icons/facebook-icon.jpg';
import twitterIcon from '../assets/icons/x-icon.jpg';
import instagramIcon from '../assets/icons/instagram-icon.png';
import youtubeIcon from '../assets/icons/youtube-icon.jpg';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isPagesDropdownOpen, setPagesDropdownOpen] = useState(false);
  const [isNavOpen, setNavOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);

  const checkLoginStatus = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.name && userInfo.token) {
      setIsLoggedIn(true);
      setUser(userInfo);
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const response = await axios.get('/api/users/points', config);
        setPoints(response.data.points);
      } catch (error) {
        console.error('Lỗi khi lấy điểm:', error);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setPoints(0);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, [location]);

  const closeNav = () => {
    setNavOpen(false);
    setUserDropdownOpen(false);
    setPagesDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setIsLoggedIn(false);
    setUser(null);
    setPoints(0);
    navigate('/home');
  };

  const handlePointsClick = () => {
    closeNav();
    navigate('/points');
  };

  return (
    <header className="header">
      <div className="top-bar">
        <Link to="/home" className="logo" onClick={closeNav}>HOTELIER</Link>

        <div className="top-bar-right d-flex align-items-center">
          <div className="contact-info d-none d-lg-flex">
            <span><i className="fas fa-envelope"></i> Hotelier@gmail.com</span>
            <span><i className="fas fa-phone"></i> 0869708914</span>
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
                  onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
                  aria-expanded={isUserDropdownOpen}
                >
                  {user.name}
                </button>
                <ul className={`dropdown-menu ${isUserDropdownOpen ? 'show' : ''}`}>
                  {user.role === 'admin' ? (
                    <>
                      <li><Link className="dropdown-item" to="/admin/dashboard" onClick={closeNav}><i className="fas fa-tachometer-alt me-2"></i>Bảng điều khiển</Link></li>
                      <li><Link className="dropdown-item" to="/admin/bookings" onClick={closeNav}><i className="fas fa-book me-2"></i>Tất cả đặt phòng</Link></li>
                      <li><Link className="dropdown-item" to="/admin/staffmanagement" onClick={closeNav}><i className="fas fa-users-cog me-2"></i>Quản lý nhân viên</Link></li>
                      <li><Link className="dropdown-item" to="/admin/users" onClick={closeNav}><i className="fas fa-user-cog me-2"></i>Quản lý người dùng</Link></li>
                      <li><Link className="dropdown-item" to="/admin/hotels" onClick={closeNav}><i className="fas fa-hotel me-2"></i>Quản lý khách sạn</Link></li>
                      <li><Link className="dropdown-item" to="/admin/createroom" onClick={closeNav}><i className="fas fa-plus me-2"></i>Tạo phòng</Link></li>
                      <li><Link className="dropdown-item" to="/admin/discounts" onClick={closeNav}><i className="fas fa-tags me-2"></i>Quản lý giảm giá</Link></li>
                      <li><Link className="dropdown-item" to="/admin/rewards" onClick={closeNav}>
                        <i className="fas fa-gift me-2"></i>Quản lý ưu đãi
                      </Link></li>
                      <li><Link className="dropdown-item" to="/admin/reviews" onClick={closeNav}><i className="fas fa-star me-2"></i>Quản lý đánh giá</Link></li>
                    </>
                  ) : user.role === 'staff' ? (
                    <>
                      <li><Link className="dropdown-item" to="/stats" onClick={closeNav}>Thống kê</Link></li>
                      <li><Link className="dropdown-item" to="/admin/users" onClick={closeNav}><i className="fas fa-user-cog me-2"></i>Quản lý người dùng</Link></li>
                      <li><Link className="dropdown-item" to="/admin/reviews" onClick={closeNav}><i className="fas fa-star me-2"></i>Quản lý đánh giá</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link className="dropdown-item" to="/bookings" onClick={closeNav}>Đặt phòng</Link></li>
                      <li><Link className="dropdown-item" to="/stats" onClick={closeNav}>Thống kê</Link></li>
                      <li><Link className="dropdown-item" to="/rewards" onClick={closeNav}><i className="fa fa-gift me-2"></i>Ưu đãi</Link></li>
                      <li><Link className="dropdown-item" to="/membership" onClick={closeNav}><i className="fas fa-star me-2"></i>Thành viên</Link></li>
                      <li><Link className="dropdown-item" to="/favorites" onClick={closeNav}><i className="fas fa-heart me-2"></i>Yêu thích</Link></li>
                      <li><button className="dropdown-item" onClick={handlePointsClick}><i className="fas fa-coins me-2"></i>Điểm thưởng ({points})</button></li>
                    </>
                  )}
                  <li><Link className="dropdown-item" to="/profile" onClick={closeNav}><i className="fas fa-user me-2"></i>Hồ sơ</Link></li>
                  <li><a className="dropdown-item" href="#" onClick={handleLogout}><i className="fas fa-sign-out-alt me-2"></i>Đăng xuất</a></li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary btn-sm me-2">Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Đăng ký</Link>
              </>
            )}
          </div>
          <div className="auth-buttons-mobile d-md-none ms-2">
            {isLoggedIn ? (
              <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
                Đăng xuất
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary btn-sm me-2">Đăng nhập</Link>
              </>
            )}
          </div>
          <button className="navbar-toggler d-md-none" type="button" onClick={() => setNavOpen(!isNavOpen)}>


            <span className="navbar-toggler-icon">☰</span>
          </button>
        </div>
      </div>


      <nav className="navbar navbar-expand-md">
        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav">
            <li className={`nav-item ${['/home', '/'].includes(location.pathname) ? 'active' : ''}`}>
              <Link className="nav-link" to="/home" onClick={closeNav}>TRANG CHỦ</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
              <Link className="nav-link" to="/about" onClick={closeNav}>GIỚI THIỆU</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/services' ? 'active' : ''}`}>
              <Link className="nav-link" to="/services" onClick={closeNav}>DỊCH VỤ</Link>
            </li>
            <li className={`nav-item ${location.pathname === '/rooms' ? 'active' : ''}`}>
              <Link className="nav-link" to="/rooms" onClick={closeNav}>PHÒNG</Link>
            </li>
            <li className={`nav-item dropdown ${['/book', '/ourteam', '/testimonial'].includes(location.pathname) ? 'active' : ''}`} onMouseLeave={() => setPagesDropdownOpen(false)}>
              <span
                className="nav-link dropdown-toggle"
                role="button"
                onClick={() => setPagesDropdownOpen(!isPagesDropdownOpen)}
                aria-haspopup="true"
                aria-expanded={isPagesDropdownOpen}
                style={{ cursor: 'pointer' }}
              >
                TRANG
              </span>
              {isPagesDropdownOpen && (
                <div className="dropdown-menu show">
                  <Link className="dropdown-item" to="/ourteam" onClick={closeNav}>Đội ngũ</Link>
                  <Link className="dropdown-item" to="/testimonial" onClick={closeNav}>Đánh giá</Link>
                </div>
              )}
            </li>
            <li className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}>
              <Link className="nav-link" to="/contact" onClick={closeNav}>LIÊN HỆ</Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;