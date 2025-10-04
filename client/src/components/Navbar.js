
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../css/navbar.css';
import axios from 'axios';

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
    const storedUserInfo = localStorage.getItem('userInfo');
    if (!storedUserInfo) return;

    const userInfo = JSON.parse(storedUserInfo);
    const userData = userInfo.user || userInfo; 

    if (userData && userData.name && userData.token) {
      setIsLoggedIn(true);
      setUser(userData);  // Set user là userData
      try {
        const config = { headers: { Authorization: `Bearer ${userData.token}` } };  
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
        <Link to="/home" className="logo" onClick={closeNav}>
          <i className="fas fa-hotel me-2"></i>
          HOTELIER
        </Link>

        <div className="top-bar-right d-flex align-items-center">
          {isLoggedIn ? (
            <div className="user-menu">
              <button
                className="user-menu-button"
                onClick={() => setUserDropdownOpen(!isUserDropdownOpen)}
              >
                <i className="fas fa-user-circle"></i>
                <span className="ms-2">{user.name}</span>
                <i className="fas fa-chevron-down ms-2"></i>
              </button>
              <ul className={`dropdown-menu ${isUserDropdownOpen ? 'show' : ''}`}>
                {user.role === 'admin' ? (
                  <>
                    <li><Link className="dropdown-item" to="/admin" onClick={closeNav}><i className="fas fa-cog me-2"></i>Quản trị</Link></li>
                    <li><Link className="dropdown-item" to="/admin/dashboard" onClick={closeNav}><i className="fas fa-tachometer-alt me-2"></i>Bảng điều khiển</Link></li>

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


                    <li>
                      <Link className="dropdown-item" to="/reviews" onClick={closeNav}>
                        <i className="fas fa-star me-2"></i>Đánh giá
                      </Link>
                    </li>

                    <li>
                      <Link className="dropdown-item" to="/discounts" onClick={closeNav}>
                        <i className="fas fa-star me-2"></i>Uu dai
                      </Link>
                    </li>

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
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-login me-2">Đăng nhập</Link>
              <Link to="/register" className="btn btn-register">Đăng ký</Link>
            </div>
          )}

          <button
            className="navbar-toggler d-md-none ms-2"
            type="button"
            onClick={() => setNavOpen(!isNavOpen)}
          >
            <i className="fas fa-bars text-white"></i>
          </button>
        </div>
      </div>

      <nav className="main-nav navbar navbar-expand-md">
        <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`}>
          <ul className="navbar-nav">
            <li className={`nav-item ${['/home', '/'].includes(location.pathname) ? 'active' : ''}`}>
              <Link className="nav-link" to="/home" onClick={closeNav}>
                <i className="fas fa-home me-2"></i>
                Trang chủ
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/rooms' ? 'active' : ''}`}>
              <Link className="nav-link" to="/rooms" onClick={closeNav}>
                <i className="fas fa-bed me-2"></i>
                Khách sạn & Phòng
              </Link>
            </li>


            <li className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
              <Link className="nav-link" to="/about" onClick={closeNav}>
                <i className="fas fa-info-circle me-2"></i>
                Về chúng tôi
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/discount' ? 'active' : ''}`}>
              <Link className="nav-link" to="/discounts" onClick={closeNav}>
                <i className="fas fa-solid fa-gifts"></i>
                Phiếu giảm giá và ưu đãi
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}>
              <Link className="nav-link" to="/contact" onClick={closeNav}>
                <i className="fas fa-envelope me-2"></i>
                Liên hệ
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;