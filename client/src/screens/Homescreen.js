import React, { useState } from "react";
import { Link } from "react-router-dom";
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";
import RoomsContent from "../components/RoomsContent";
import AlertMessage from "../components/AlertMessage";
import "../css/homescreen.css";

function Homescreen() {
  const [bookingStatus, setBookingStatus] = useState(null); // { type, message }

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
      <section className="booking-section">
        <BookingForm onBookingStatus={handleBookingStatus} />
      </section>
      <section className="intro-section">
        <div className="intro-container">
          <h2 className="subtitle">
            <span className="line"></span>
            WELCOME TO HOTELIER
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Discover A <span>Luxurious</span> Experience
          </h1>
          <p>
            Hotelier mang đến sự kết hợp hoàn hảo giữa sự thoải mái và thanh lịch với các tiện nghi hiện đại, ẩm thực tinh tế và dịch vụ đặc biệt.
          </p>
          <Link to="/about" className="btn btn-explore">Learn More</Link>
        </div>
      </section>
      <section className="services-section">
        <div className="container">
          <div className="services-header text-center">
            <h2 className="subtitle">
              <span className="line"></span>
              OUR SERVICES
              <span className="line"></span>
            </h2>
            <h1 className="title">
              Explore Our <span>SERVICES</span>
            </h1>
          </div>
          <div className="row">
            {[
              { title: "Spa & Fitness", icon: "🧘", description: "Thư giãn và năng lượng với spa cao cấp nhất 2025." },
              { title: "Food & Restaurant", icon: "🍽️", description: "Ẩm thực đa dạng phong phú từ địa phương đến quốc tế." },
              { title: "Event & Party", icon: "🎉", description: "Tổ chức sự kiện với không gian lý tưởng và sang trọng." },
            ].map((service, index) => (
              <div className="col-md-4 col-sm-6 mb-4" key={index}>
                <div className="service-box">
                  <div className="service-icon">{service.icon}</div>
                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/services" className="btn btn-explore">View All Services</Link>
          </div>
        </div>
      </section>
      <section className="rooms-section">
        <RoomsContent />
      </section>
      <section className="team-section">
        <div className="container">
          <div className="team-header text-center">
            <h2 className="subtitle">
              <span className="line"></span>
              OUR TEAM
              <span className="line"></span>
            </h2>
            <h1 className="title">
              Meet Our <span>EXPERTS</span>
            </h1>
          </div>
          <p className="team-description">Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng phục vụ bạn.</p>
          <Link to="/ourteam" className="btn btn-explore">Meet The Team</Link>
        </div>
      </section>
      <section className="contact-section">
        <div className="container">
          <div className="contact-header text-center">
            <h2 className="subtitle">
              <span className="line"></span>
              CONTACT US
              <span className="line"></span>
            </h2>
            <h1 className="title">
              Get In Touch With Us
            </h1>
          </div>
          <p className="contact-description">Chúng tôi luôn sẵn sàng hỗ trợ bạn.</p>
          <Link to="/contact" className="btn btn-explore">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}

export default Homescreen;