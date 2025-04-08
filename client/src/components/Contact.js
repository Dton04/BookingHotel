import React from 'react';
import '../css/Contact.css';
import Banner from './Banner';
import BookingForm from './BookingForm'; // Import BookingForm

function Contact() {
  return (
    <div className="contact-page">
      <Banner />

      <div className="contact-container">
        {/* Thêm BookingForm Component lên đầu */}
        <section className="new-booking-section">
          <BookingForm />
        </section>

        <div className="divider"></div>

        {/* Contact Info Section */}
        <section className="contact-section">
          <h2 className="section-heading">LIÊN HỆ VỚI CHÚNG TÔI</h2>
          <p className="section-subtitle">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua thông tin dưới đây.
          </p>
          
          <div className="contact-info">
            <div className="info-box">
              <h4>Địa chỉ</h4>
              <p>123 Đường Lê Lợi, Quận 1, TP.HCM</p>
            </div>
            <div className="info-box">
              <h4>Số điện thoại</h4>
              <p>+84 123 456 789</p>
            </div>
            <div className="info-box">
              <h4>Email</h4>
              <p>info@luxuryhotel.com</p>
            </div>
          </div>
        </section>

        <div className="divider"></div>

        {/* Contact Form and Map Section */}
        <section className="contact-main">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-container">
              <h2 className="form-title">GỬI TIN NHẮN CHO CHÚNG TÔI</h2>
              <form className="contact-form">
                <div className="form-group">
                  <input type="text" placeholder="Họ và tên" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Email" required />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Tiêu đề" required />
                </div>
                <div className="form-group">
                  <textarea placeholder="Nội dung tin nhắn" required></textarea>
                </div>
                <button type="submit" className="send-btn">GỬI TIN NHẮN</button>
              </form>
            </div>

            {/* Map Section */}
            <div className="map-container">
              <iframe
                title="Bản đồ Luxury Hotel TP.HCM"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.440559003735!2d106.7052703152609!3d10.775847392321313!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f46fb7b991d%3A0x8a4a9e2b5d9a0a1e!2sLuxury%20Hotel%20Saigon!5e0!3m2!1sen!2s!4v1620000000000!5m2!1sen!2s"
                allowFullScreen=""
                loading="lazy"
              ></iframe>
              <div className="location-tags">
                <span>Quận 1</span>
                <span>Trung tâm thành phố</span>
                <span>Gần chợ Bến Thành</span>
                <span>View sông Sài Gòn</span>
              </div>
            </div>
          </div>
        </section>

        <div className="divider"></div>
      </div>
    </div>
  );
}

export default Contact;