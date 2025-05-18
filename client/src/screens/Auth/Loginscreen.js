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