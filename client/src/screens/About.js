import React, { useState, useEffect } from "react";
import "../css/booking-form.css";
import "../css/about.css"; // File CSS tùy chỉnh
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";
import axios from "axios";

function About() {
  const [stats, setStats] = useState({
    hotel: 0,
    staff: 0,
    clients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // // Fetch rooms count
        // const roomsResponse = await axios.get("http://localhost:5000/api/rooms/getallrooms");
        // const roomsCount = roomsResponse.data.length;

        // Fetch hotels count (optional, if you want to display hotels instead of rooms)
        const hotelsResponse = await axios.get("http://localhost:5000/api/hotels");
        const hotelsCount = hotelsResponse.data.length;

        // Fetch staff count (requires authentication)
        const staffResponse = await axios.get("http://localhost:5000/api/users/staff", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Assuming token is stored in localStorage
          },
        });
        const staffCount = staffResponse.data.length;

        // Fetch users count (requires authentication)
        const usersResponse = await axios.get("http://localhost:5000/api/users/allusers", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const usersCount = usersResponse.data.length;

        setStats({
          hotel: hotelsCount,
          staff: staffCount,
          clients: usersCount,
        });
      } catch (err) {
        console.error("Error fetching stats:", err.message);
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
        // Fallback to default values
        setStats({
          hotel: 0,
          staff: 0,
          clients: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="about-page">
      <Banner />

      <div className="divider"></div>

      <div className="about-container">
        <div className="about-content">
          <div className="about-text">
            <h6 className="about-subtitle">ABOUT US</h6>
            <h1 className="about-title">
              Welcome to <span className="highlight">HOTELIER</span>
            </h1>
            <p className="about-description">
              Hotelier là website đặt khách sạn hàng đầu, cung cấp cho bạn những trải nghiệm tuyệt vời
              mang đến sự kết hợp hoàn hảo giữa sự thoải mái và thanh lịch. Khách sạn của chúng tôi có
              các tiện nghi hiện đại, các lựa chọn ăn uống tinh tế và dịch vụ đặc biệt
              để đảm bảo một kỳ nghỉ đáng nhớ cho khách của chúng tôi. Cho dù bạn đến đây để
              công tác hay giải trí, chúng tôi có mọi thứ bạn cần để chuyến thăm của bạn
              trở nên khó quên.
            </p>
          </div>

          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-icon">
                <i className="fas fa-hotel"></i>
              </div>
              <h2 className="stat-number">{loading ? "..." : stats.hotel}</h2>
              <p className="stat-label">Khách sạn</p>
            </div>

            <div className="stat-box">
              <div className="stat-icon">
                <i className="fas fa-users-cog"></i>
              </div>
              <h2 className="stat-number">{loading ? "..." : stats.staff}</h2>
              <p className="stat-label">Nhân viên</p>
            </div>

            <div className="stat-box">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <h2 className="stat-number">{loading ? "..." : stats.clients}</h2>
              <p className="stat-label">Người dùng</p>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button className="explore-button">EXPLORE MORE</button>
        </div>

        <div className="about-images">
          <div className="image-grid">
            <img src="/images/about-1.jpg" alt="Hotel view 1" className="grid-img" />
            <img src="/images/about-2.jpg" alt="Hotel view 2" className="grid-img" />
            <img src="/images/about-3.jpg" alt="Hotel view 3" className="grid-img" />
            <img src="/images/about-4.jpg" alt="Hotel view 4" className="grid-img" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;