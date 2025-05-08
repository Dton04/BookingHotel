import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/auth.css';

function Registerscreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp!');
      return;
    }

    if (!name || !email || !password) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    if (phone && (phone.length > 10 || !/^[0-9]*$/.test(phone))) {
      setError('Số điện thoại phải tối đa 10 chữ số và chỉ chứa số.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/users/register', { 
        name, 
        email, 
        password, 
        phone 
      });
      setSuccess('Đăng ký thành công! Chuyển hướng đến đăng nhập...');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Gửi yêu cầu đến server để khởi động flow OAuth
    window.location.href = `${process.env.REACT_APP_API_URL}/api/users/google`;
    // Hoặc nếu dùng proxy trong package.json:
    // window.location.href = '/api/users/google';
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Tạo Tài Khoản</h1>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Họ Tên</label>
            <input
              type="text"
              className="form-control"
              id="name"
              placeholder="Nhập họ tên của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

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
            <label htmlFor="phone">Số Điện Thoại (Tùy chọn)</label>
            <input
              type="text"
              className="form-control"
              id="phone"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật Khẩu</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Tạo mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Xác Nhận Mật Khẩu</label>
            <input
              type="password"
              className="form-control"
              id="confirm-password"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-register"
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
          </button>
        </form>

        <button
          className="btn btn-google"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          Đăng Ký Bằng Google
        </button>

        <div className="links">
          <p>
            Đã có tài khoản? <Link to="/login">Đăng nhập tại đây</Link>
          </p>
          <p>
            <Link to="/">Quay lại Trang Chủ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registerscreen;