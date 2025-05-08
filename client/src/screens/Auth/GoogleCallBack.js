import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const userDataParam = query.get('user');
    if (userDataParam) {
      const parsedUserData = JSON.parse(decodeURIComponent(userDataParam));
      setUserData(parsedUserData);
    } else {
      navigate('/login?error=Google authentication failed');
    }
  }, [location, navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/users/verify-otp', {
        userId: userData._id,
        otp,
      });

      localStorage.setItem('userInfo', JSON.stringify(response.data));
      if (response.data.isAdmin) {
        navigate('/home');
      } else if (response.data.role === 'staff') {
        navigate('/home');
      } else {
        navigate('/home');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Xác minh thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return <div>Đang xử lý xác thực...</div>;
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Xác minh OTP</h1>
        <p>Một mã OTP đã được gửi đến email: {userData.email}</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleVerifyOtp}>
          <div className="form-group">
            <label htmlFor="otp">Mã OTP</label>
            <input
              type="text"
              className="form-control"
              id="otp"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-register"
            disabled={loading}
          >
            {loading ? 'Đang xác minh...' : 'Xác minh'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default GoogleCallback;