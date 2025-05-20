import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/loginscreen.css';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/users/login', { email, password });
      const userData = response.data;
      // Lưu thông tin người dùng
      localStorage.setItem('userInfo', JSON.stringify(userData));
      // Lưu token riêng
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      } else {
        throw new Error('Không nhận được token từ server');
      }
      setSuccess('Đăng nhập thành công! Đang chuyển hướng...');
      setEmail('');
      setPassword('');

      setTimeout(() => {
        if (userData.isAdmin) {
          navigate('/home');
        } else if (userData.role === 'staff') {
          navigate('/home');
        } else {
          navigate('/home');
        }
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    setSuccess('');
    window.location.href = 'http://localhost:5000/api/users/google';
  };

  const handleFacebookLogin = () => {
    setLoading(true);
    setError('');
    setSuccess('');
    window.location.href = 'http://localhost:5000/api/users/facebook';
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Đăng Nhập</h1>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-login"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Nút đăng nhập bằng Google */}
        <div className="google-login">
          <button
            onClick={handleGoogleLogin}
            className="btn btn-google"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <svg
                  className="google-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
                    fill="#4285F4"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.99999 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 8.99999 14.4205C6.6559 14.4205 4.67181 12.8373 3.96408 10.71H0.957264V13.0418C2.43817 15.9832 5.48181 18 8.99999 18Z"
                    fill="#34A853"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.96409 10.71C3.78409 10.17 3.68181 9.59318 3.68181 9C3.68181 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
                    fill="#FBBC05"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.99999 3.57955C10.3218 3.57955 11.5077 4.03364 12.4409 4.92545L15.0218 2.34455C13.4636 0.891818 11.4264 0 8.99999 0C5.48181 0 2.43817 2.01682 0.957273 4.95818L3.96409 7.29C4.67181 5.16273 6.6559 3.57955 8.99999 3.57955Z"
                    fill="#EA4335"
                  />
                </svg>
                Đăng nhập bằng Google
              </>
            )}
          </button>
        </div>

        {/* Nút đăng nhập bằng Facebook */}
        <div className="facebook-login">
          <button
            onClick={handleFacebookLogin}
            className="btn btn-facebook"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <svg
                  className="facebook-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 22.18V15H8V12H10V9.67C10 7.56 11.44 6 13.67 6H16V9H14C13.45 9 13 9.45 13 10V12H15.75L15 15H13V22.18C17.56 20.87 21 16.84 21 12H22Z"
                    fill="#4267B2"
                  />
                </svg>
                Đăng nhập bằng Facebook
              </>
            )}
          </button>
        </div>

        <div className="links">
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký tại đây</Link>
          </p>
          <p>
            <Link to="/">Quay lại trang chủ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;