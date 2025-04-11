import React from "react";
import { Link } from "react-router-dom";
import Banner from "../components/Banner";
import BookingForm from "../components/BookingForm";
import RoomsContent from "../components/RoomsContent";
import "../css/homescreen.css";

function Homescreen() {
  return (
    <div className="homescreen">
      {/* Banner */}
      <Banner />

      {/* Form đặt phòng */}
      <section className="booking-section">
        <BookingForm />
      </section>

      {/* Phần giới thiệu ngắn */}
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

      {/* Phần Services */}
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
              { title: "Spa & Fitness", icon: "🧘", description: "Thư giãn và tái tạo năng lượng với spa cao cấp." },
              { title: "Food & Restaurant", icon: "🍽️", description: "Ẩm thực đa dạng từ địa phương đến quốc tế." },
              { title: "Event & Party", icon: "🎉", description: "Tổ chức sự kiện với không gian lý tưởng." },
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

      {/* Phần Rooms */}
      <section className="rooms-section">
        <RoomsContent />
      </section>
    </div>
  );
}

export default Homescreen;