import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";
import RoomsContent from "../components/RoomsContent";
import AlertMessage from "../components/AlertMessage";
import { useNavigate } from "react-router-dom";
import "../css/homescreen.css";

import '../css/promotion-section.css';

function Homescreen() {
  const [bookingStatus, setBookingStatus] = useState(null);
  const [regions, setRegions] = useState([]);
  const [stats, setStats] = useState({
    rooms: 150,
    customers: 1200,
    rating: 4.8,
    awards: 12
  });
  const [festivalDiscounts, setFestivalDiscounts] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    fetch("/api/discounts/festival")
      .then(res => res.json())
      .then(data => setFestivalDiscounts(data))
      .catch(err => console.error("Error loading festival discounts:", err));
  }, []);


  // Fetch regions từ BE
  useEffect(() => {
    fetch("/api/regions")
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(err => console.error("Error loading regions:", err));
  }, []);

  const promotions = [
    { title: "Đặt Sớm - Giảm Sâu", badge: "Giảm 25%", desc: "Đặt phòng trước 30 ngày - Giảm ngay 25%" },
    { title: "Ở Dài - Giảm Nhiều", badge: "Giảm 15%", desc: "Đặt từ 3 đêm trở lên - Giảm ngay 15%" },
    { title: "Combo Ăn Sáng", badge: "Tặng Bữa Sáng", desc: "Đặt phòng kèm ăn sáng - Tiết kiệm 20%" },
    { title: "Ưu Đãi Thành Viên", badge: "Giảm 10%", desc: "Đăng ký thành viên - Giảm thêm 10%" },
  ];


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




      {/* Địa điểm đẹp */}
      <section className="destinations-section">
        <div className="container">
          <div className="destinations-header text-center">
            <h2 className="subtitle">
              <span className="line"></span>ĐỊA ĐIỂM ĐẸP<span className="line"></span>
            </h2>
            <h1 className="title">Khám phá <span>VIỆT NAM</span></h1>
          </div>
          <div className="row">
            {regions.map((region, index) => (
              <div className="col-md-4 mb-4" key={region._id}>
                <div className="destination-card">
                  <div className="destination-img-wrapper">
                    <img
                      src={region.imageUrl || `/images/region-${index + 1}.jpg`}
                      alt={region.name}
                      className="destination-img"
                    />
                    <div className="destination-overlay">
                      <h3>{region.name}</h3>
                      <Link
                        to={`/room-results?destination=${region._id}`}
                        className="btn btn-destination"
                      >
                        Khám phá
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="festival-section py-5 bg-gradient">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="festival-subtitle">
              <span className="line"></span> ƯU ĐÃI LỄ HỘI <span className="line"></span>
            </h2>
            <h1 className="festival-title">
              Không khí lễ hội - <span>Ưu đãi tuyệt vời!</span>
            </h1>
            <p className="festival-desc">
              Khám phá những ưu đãi độc quyền trong mùa lễ hội — tiết kiệm đến <strong>50%</strong> cho các điểm đến nổi bật!
            </p>
          </div>

          <div className="row justify-content-center">
            {festivalDiscounts.map((festival) => (
              <div className="col-md-4 col-lg-3 mb-4" key={festival._id}>
                <div
                  className="festival-card position-relative overflow-hidden rounded-4 shadow-lg border-0"
                  onClick={() => navigate(`/festival/${festival._id}`)}
                  style={{ cursor: "pointer", transition: "transform 0.3s" }}
                >
                  <div className="festival-img-wrapper">
                    <img
                      src={festival.image || "/default-festival.jpg"}
                      alt={festival.name}
                      className="festival-img rounded-4"
                    />
                    <div className="festival-badge">Giảm {festival.discountValue}%</div> 
                  </div>
                  <div className="festival-info text-center p-3">
                    <h5 className="fw-bold">{festival.name}</h5>
                    <p className="text-muted small mb-3">
                      {festival.description?.slice(0, 60) || "Khám phá các ưu đãi độc quyền mùa lễ hội."}
                    </p>
                    <button className="btn btn-festival px-4 py-2">
                      Khám phá ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Ưu đãi cuối năm */}
      <section className="year-end-deals text-center py-5 bg-light">
        <div className="container">
          <h2 className="subtitle mb-3">Ưu Đãi Cuối Năm 🎉</h2>
          <h1 className="title mb-4">Vui là chính, không cần dài</h1>
          <p className="mb-4">Tận hưởng thêm chút nắng vàng cuối mùa với giảm giá tối thiểu 15%</p>
          <Link to="/deals" className="btn btn-primary btn-lg">
            Tìm ưu đãi
          </Link>
        </div>
      </section>





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
                description: "Thư giãn với các liệu pháp spa cao cấp và phòng tập hiện đại.",
                features: ["Massage trị liệu", "Yoga", "Phòng tập hiện đại", "Xông hơi"]
              },
              {
                title: "Ẩm thực đặc sắc",
                icon: "utensils",
                description: "Khám phá hương vị độc đáo từ đội ngũ đầu bếp 5 sao.",
                features: ["Buffet quốc tế", "Nhà hàng Á - Âu", "Bar & Lounge", "Dịch vụ phòng 24/7"]
              },
              {
                title: "Hội nghị & Sự kiện",
                icon: "calendar-alt",
                description: "Không gian sang trọng cho mọi dịp đặc biệt của bạn.",
                features: ["Phòng hội nghị hiện đại", "Tổ chức tiệc cưới", "Sự kiện doanh nghiệp", "Thiết bị nghe nhìn"]
              },
              {
                title: "Dịch vụ Concierge",
                icon: "concierge-bell",
                description: "Hỗ trợ 24/7 cho mọi nhu cầu của quý khách.",
                features: ["Đặt tour du lịch", "Thuê xe", "Đặt vé máy bay", "Hướng dẫn viên"]
              }
            ].map((service, index) => (
              <div className="col-md-6 col-lg-3 mb-4" key={index}>
                <div className="service-box">
                  <div className="service-icon">
                    <i className={`fas fa-${service.icon}`}></i>
                  </div>
                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                  <ul className="service-features">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex}>
                        <i className="fas fa-check"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="btn btn-service">Xem chi tiết</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Rooms Section */}
      <section className="rooms-section">
        <div className="rooms-header text-center">
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