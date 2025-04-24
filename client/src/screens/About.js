import React from "react";
import "../css/booking-form.css";
import "../css/about.css"; // File CSS tùy chỉnh
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";
function About() {
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
            <h2 className="stat-number">1234</h2>
            <p className="stat-label">Rooms</p>
          </div>

          <div className="stat-box">
            <div className="stat-icon">
              <i className="fas fa-users-cog"></i>
            </div>
            <h2 className="stat-number">1234</h2>
            <p className="stat-label">Staffs</p>
          </div>

          <div className="stat-box">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <h2 className="stat-number">1234</h2>
            <p className="stat-label">Clients</p>
          </div>
        </div>

        <button className="explore-button">EXPLORE MORE</button>
      </div>

      <div className="about-images">
        <div className="image-grid">
          <img
            src="/images/about-1.jpg"
            alt="Hotel view 1"
            className="grid-img"
          />
          <img
            src="/images/about-2.jpg"
            alt="Hotel view 2"
            className="grid-img"
          />
          <img
            src="/images/about-3.jpg"
            alt="Hotel view 3"
            className="grid-img"
          />
          <img
            src="/images/about-4.jpg"
            alt="Hotel view 4"
            className="grid-img"
          />
        </div>
      </div>
    </div>
    </div>
    
  );
}

export default About;
