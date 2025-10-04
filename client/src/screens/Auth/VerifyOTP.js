import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email');

  const handleVerify = async () => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/users/verify-otp", {
        email,
        otp,
      });

      // Lưu token, redirect Home
      localStorage.setItem("userInfo", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Xác minh OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <h2>Xác nhận OTP</h2>
      <p>Mã OTP đã được gửi đến email: <b>{email}</b></p>
      {error && <div className="alert alert-danger">{error}</div>}
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Nhập mã OTP"
        disabled={loading}
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? 'Đang xác minh...' : 'Xác nhận'}
      </button>
    </div>
  );
}

export default VerifyOTP;
