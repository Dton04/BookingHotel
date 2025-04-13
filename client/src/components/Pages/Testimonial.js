import React, { useState, useEffect } from 'react';
import Banner from '../Banner';
import BookingForm from '../BookingForm';
import RatingForm from '../RatingForm'; // Import RatingForm
import '../../css/testimonial.css';

const testimonials = [
  {
    id: 1,
    text: "Tempor stet labore dolor clita stet diam amet ipsum dolor duo ipsum rebum stet dolor amet diam stet. Est stet ea lorem amet est kasd kasd et erat magna eos",
    name: "Client Name",
    profession: "Profession",
    image: "/images/client-1.jpg"
  },
  {
    id: 2,
    text: "Tempor stet labore dolor clita stet diam amet ipsum dolor duo ipsum rebum stet dolor amet diam stet. Est stet ea lorem amet est kasd kasd et erat magna eos",
    name: "Client Name",
    profession: "Profession",
    image: "/images/client-2.jpg"
  },
  {
    id: 3,
    text: "Tempor stet labore dolor clita stet diam amet ipsum dolor duo ipsum rebum stet dolor amet diam stet. Est stet ea lorem amet est kasd kasd et erat magna eos",
    name: "Client Name",
    profession: "Profession",
    image: "/images/client-3.jpg"
  }
];

function Testimonial() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationState, setAnimationState] = useState('fade-in');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasBooked, setHasBooked] = useState(false); // Kiểm tra trạng thái đặt phòng

  // Giả lập kiểm tra trạng thái đặt phòng
  useEffect(() => {
    // TODO: Thay bằng API thực tế
    const checkBookingStatus = async () => {
      // const response = await fetch('/api/check-booking');
      // const data = await response.json();
      // setHasBooked(data.hasBooked);
      setHasBooked(true); // Giả lập
    };
    checkBookingStatus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationState('fade-prev');
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? Math.max(0, testimonials.length - 2) : prevIndex - 1
      );
      setAnimationState('fade-in');
      setIsAnimating(false);
    }, 600);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimationState('fade-next');
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex >= testimonials.length - 2 ? 0 : prevIndex + 1
      );
      setAnimationState('fade-in');
      setIsAnimating(false);
    }, 600);
  };

  // Xử lý submit đánh giá
  const handleRatingSubmit = (formData) => {
    // TODO: Gọi API để gửi đánh giá
    console.log('Submitted rating:', {
      rating: formData.get('rating'),
      content: formData.get('content'),
      image: formData.get('image')
    });
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
      <BookingForm />
      
      <div className="testimonial-section" style={{ backgroundImage: `url('/images/testimonial-bg.jpg')` }}>
        <div className="testimonial-container">
          <button className="nav-btn prev" onClick={handlePrev} disabled={isAnimating}>
            <div className="arrow-circle">
              <i className="fas fa-chevron-left"></i>
            </div>
          </button>

          <div className="testimonial-wrapper">
            <div className={`testimonial-cards ${animationState}`}>
              {testimonials.length > 1 &&
                [0, 1].map((offset) => {
                  const index = (currentIndex + offset) % testimonials.length;
                  const testimonial = testimonials[index];
                  if (!testimonial) return null;
                  return (
                    <div
                      key={testimonial.id}
                      className="testimonial-card"
                    >
                      <p className="testimonial-text">
                        {testimonial.text}
                      </p>
                      <div className="testimonial-author">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="author-image"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/60";
                          }}
                        />
                        <div className="author-info">
                          <h4 className="author-name">{testimonial.name}</h4>
                          <p className="author-profession">{testimonial.profession}</p>
                        </div>
                      </div>
                      <div className="quote-icon">
                        <i className="fas fa-quote-right"></i>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <button className="nav-btn next" onClick={handleNext} disabled={isAnimating}>
            <div className="arrow-circle">
              <i className="fas fa-chevron-right"></i>
            </div>
          </button>
        </div>
      </div>

      <RatingForm onSubmit={handleRatingSubmit} hasBooked={hasBooked} />
    </div>
  );
}

export default Testimonial;