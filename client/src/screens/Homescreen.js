import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";
import RoomsContent from "../components/RoomsContent";
import AlertMessage from "../components/AlertMessage";
import "../css/homescreen.css";

function Homescreen() {
  const [bookingStatus, setBookingStatus] = useState(null);
  const [stats, setStats] = useState({
    rooms: 150,
    customers: 1200,
    rating: 4.8,
    awards: 12
  });

  const handleBookingStatus = (status) => {
    setBookingStatus(status);
  };

  const handleCloseAlert = () => {
    setBookingStatus(null);
  };

  return (
    <div className="homescreen">
      <AlertMessage
        type={bookingStatus?.type}
        message={bookingStatus?.message}
        onClose={handleCloseAlert}
      />
      <Banner />
      
      {/* Booking Form Section with Enhanced UI */}
      <section className="booking-section">
        <div className="booking-container">
          <div className="booking-header text-center mb-4">
            <h2 className="subtitle">
              <span className="line"></span>
              BOOK YOUR STAY
              <span className="line"></span>
            </h2>
            <h1 className="title">Find Your Perfect Room</h1>
          </div>
          <BookingForm onBookingStatus={handleBookingStatus} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="row stats-container">
            <div className="col-md-3 col-sm-6">
              <div className="stat-item">
                <div className="stat-number">{stats.rooms}+</div>
                <div className="stat-label">Luxury Rooms</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-item">
                <div className="stat-number">{stats.customers}+</div>
                <div className="stat-label">Happy Customers</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-item">
                <div className="stat-number">{stats.rating}</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="stat-item">
                <div className="stat-number">{stats.awards}</div>
                <div className="stat-label">Awards Won</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="intro-section">
        <div className="intro-container">
          <h2 className="subtitle">
            <span className="line"></span>
            WELCOME TO HOTELIER
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Experience Luxury & <span>Comfort</span>
          </h1>
          <p className="intro-description">
            Chào mừng đến với Hotelier - nơi sang trọng gặp gỡ sự thoải mái. Chúng tôi tự hào mang đến:
          </p>
          <div className="intro-features">
            <div className="feature-item">
              <i className="fas fa-concierge-bell"></i>
              <span>Dịch vụ 24/7</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-wifi"></i>
              <span>Wi-Fi Tốc độ cao</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-utensils"></i>
              <span>Nhà hàng 5 sao</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-spa"></i>
              <span>Spa & Wellness</span>
            </div>
          </div>
          <Link to="/about" className="btn btn-explore">Khám phá thêm</Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="container">
          <div className="services-header text-center">
            <h2 className="subtitle">
              <span className="line"></span>
              DỊCH VỤ CAO CẤP
              <span className="line"></span>
            </h2>
            <h1 className="title">
              Trải nghiệm <span>ĐẲNG CẤP</span>
            </h1>
          </div>
          <div className="row">
            {[
              { 
                title: "Spa & Wellness", 
                icon: "spa",
                description: "Thư giãn với các liệu pháp spa cao cấp và phòng tập hiện đại." 
              },
              { 
                title: "Ẩm thực đặc sắc", 
                icon: "restaurant",
                description: "Khám phá hương vị độc đáo từ đội ngũ đầu bếp 5 sao." 
              },
              { 
                title: "Hội nghị & Sự kiện", 
                icon: "event",
                description: "Không gian sang trọng cho mọi dịp đặc biệt của bạn." 
              },
              { 
                title: "Dịch vụ Concierge", 
                icon: "concierge",
                description: "Hỗ trợ 24/7 cho mọi nhu cầu của quý khách." 
              }
            ].map((service, index) => (
              <div className="col-md-6 col-lg-3 mb-4" key={index}>
                <div className="service-box">
                  <div className="service-icon">
                    <i className={`fas fa-${service.icon}`}></i>
                  </div>
                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section className="rooms-section">
        <div className="rooms-header text-center">
          <h2 className="subtitle">
            <span className="line"></span>
            PHÒNG & SUITE
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Lựa chọn <span>HOÀN HẢO</span>
          </h1>
        </div>
        <RoomsContent />
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="testimonials-header text-center">
            <h2 className="subtitle">
              <span className="line"></span>
              ĐÁNH GIÁ
              <span className="line"></span>
            </h2>
            <h1 className="title">
              Khách hàng nói gì về <span>CHÚNG TÔI</span>
            </h1>
          </div>
          <div className="row testimonials-container">
            {[
              {
                name: "Nguyễn Văn A",
                role: "Doanh nhân",
                comment: "Dịch vụ tuyệt vời, phòng ốc sang trọng và sạch sẽ.",
                rating: 5
              },
              {
                name: "Trần Thị B",
                role: "Nghệ sĩ",
                comment: "Không gian tuyệt đẹp, nhân viên thân thiện.",
                rating: 5
              },
              {
                name: "Lê Văn C",
                role: "Du khách",
                comment: "Trải nghiệm đáng nhớ, chắc chắn sẽ quay lại.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div className="col-md-4" key={index}>
                <div className="testimonial-card">
                  <div className="testimonial-rating">
                    {"★".repeat(testimonial.rating)}
                  </div>
                  <p className="testimonial-text">{testimonial.comment}</p>
                  <div className="testimonial-author">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-header text-center">
            <h2 className="subtitle">
              <span className="line"></span>
              LIÊN HỆ
              <span className="line"></span>
            </h2>
            <h1 className="title">
              Đặt phòng ngay
            </h1>
          </div>
          <div className="contact-content">
            <div className="row">
              <div className="col-md-4">
                <div className="contact-info">
                  <i className="fas fa-phone"></i>
                  <h3>Điện thoại</h3>
                  <p>+84 123 456 789</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="contact-info">
                  <i className="fas fa-envelope"></i>
                  <h3>Email</h3>
                  <p>info@hotelier.com</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="contact-info">
                  <i className="fas fa-map-marker-alt"></i>
                  <h3>Địa chỉ</h3>
                  <p>123 Đường ABC, Thành phố XYZ</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <Link to="/contact" className="btn btn-contact">Liên hệ ngay</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Homescreen;