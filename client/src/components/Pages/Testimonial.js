import React, { useState, useEffect } from 'react';
import Banner from '../Banner';
import BookingForm from '../BookingForm';
import '../../css/testimonial.css'; // Import CSS for styling

const testimonials = [
  {
    id: 1,
    text: "Khách sạn tồi tệ, không đáp ứng được nhu cầu của khách hàng",
    name: "Client Name",
    profession: "Profession",
    image: "/images/client-1.jpg"
  },
  {
    id: 2,
    text: "Trải nghiệm tuyệt vời, dịch vụ tốt, phòng rất sạch sẽ",
    name: "Client Name",
    profession: "Profession",
    image: "/images/client-2.jpg"
  },
  {
    id: 3,
    text: "Khách sạn ổn nhưng không có khu vui chơi",
    name: "Client Name",
    profession: "Profession",
    image: "/images/client-3.jpg"
  }
];

function Testimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);

  console.log("Rendering with currentIndex:", currentIndex);

  // Auto slider function
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []); // No dependency needed now

  // Navigate to previous slide
  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  // Navigate to next slide
  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Handle rating button click
  const handleRatingClick = () => {
    alert("Cảm ơn bạn! Chức năng đánh giá sẽ sớm được cập nhật.");
  };

  // Background style inline
  const backgroundStyle = {
    background: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/images/testimonial-bg.jpg") no-repeat center center',
    backgroundSize: 'cover'
  };

  // Kiểm tra hình ảnh
  useEffect(() => {
    testimonials.forEach((testimonial) => {
      const img = new Image();
      img.onload = () => console.log(`Hình ảnh ${testimonial.image} tải thành công!`);
      img.onerror = () => console.error(`Lỗi: Không thể tải hình ảnh ${testimonial.image}`);
      img.src = testimonial.image;
    });
  }, []);

  return (
    <div className="testimonial-page">
      <Banner />
      <BookingForm/>

      <div className="testimonial-container" style={backgroundStyle}>
        <div className="testimonial-content">
          <h2 className="testimonial-title">Đánh giá của khách hàng</h2>

          <div className="testimonial-slider">
            <button className="slider-nav prev-button" onClick={prevSlide}>
              <i className="fas fa-chevron-left"></i>
            </button>

            <div className="testimonial-wrapper">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`testimonial-slide ${index === currentIndex ? 'active' : ''}`}
                >
                  <div className="testimonial-card">
                    <p className="testimonial-text">{testimonial.text}</p>
                    <div className="testimonial-client">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="client-image"
                        onError={(e) => {
                          console.error("Failed to load image:", e.target.src);
                          e.target.src = "https://via.placeholder.com/70";
                        }}
                      />
                      <div className="client-info">
                        <h4 className="client-name">{testimonial.name}</h4>
                        <p className="client-profession">{testimonial.profession}</p>
                      </div>
                    </div>
                    <div className="quote-icon">
                      <i className="fas fa-quote-right"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="slider-nav next-button" onClick={nextSlide}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="testimonial-indicator">
            {testimonials.map((_, index) => (
              <span
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              ></span>
            ))}
          </div>
        </div>
        <div>
          <button className="rating-button" onClick={handleRatingClick}>
            Đánh giá
          </button>
        </div>
      </div>
    </div>
  );
}

export default Testimonial;
