import React, { useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../../css/verifyotp.css";

function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get("email");

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Tự động chuyển sang ô kế tiếp
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Vui lòng nhập đủ 6 số OTP");

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/users/verify-otp", {
        email,
        otp: code,
      });
      localStorage.setItem("userInfo", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.user.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Xác minh OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-wrapper">
      <div className="verify-card">
        <h2 className="verify-title">Xác nhận mã OTP</h2>
        <p className="verify-subtitle">
          Mã OTP đã được gửi đến email: <span>{email}</span>
        </p>

        {error && <div className="verify-error">{error}</div>}

        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputRefs.current[index] = el)}
              disabled={loading}
            />
          ))}
        </div>

        <button
          className={`verify-btn ${loading ? "loading" : ""}`}
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? <span className="loader"></span> : "Xác nhận"}
        </button>

        <p className="verify-footer">
          Không nhận được mã? <a href="#">Gửi lại</a>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;
