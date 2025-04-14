import React, { useState, useEffect } from 'react';
import Banner from '../Banner';
import BookingForm from '../BookingForm';
import RatingForm from '../RatingForm';
import axios from 'axios';
import '../../css/testimonial.css';

function Testimonial() {
  const [reviews, setReviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationState, setAnimationState] = useState('fade-in');
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasBooked, setHasBooked] = useState(null); // null: đang kiểm tra, false: chưa đặt, true: đã đặt
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [rooms, setRooms] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, totalReviews: 0 });

  // Fetch danh sách phòng
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/rooms/getallrooms');
        setRooms(response.data);
        if (response.data.length > 0) {
          setSelectedRoom(response.data[0]._id); // Chọn phòng đầu tiên mặc định
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    fetchRooms();
  }, []);

  // Fetch danh sách đánh giá
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get('/api/reviews', {
          params: { roomId: selectedRoom || 'all' },
        });
        setReviews(response.data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    if (selectedRoom) {
      fetchReviews();
    }
  }, [selectedRoom]);

  // Fetch điểm trung bình đánh giá
  useEffect(() => {
    const fetchAverageRating = async () => {
      try {
        const response = await axios.get('/api/reviews/average', {
          params: { roomId: selectedRoom },
        });
        setAverageRating(response.data);
      } catch (error) {
        console.error('Error fetching average rating:', error);
      }
    };

    if (selectedRoom) {
      fetchAverageRating();
    }
  }, [selectedRoom]);

  // Kiểm tra trạng thái đặt phòng
  useEffect(() => {
    const checkBookingStatus = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail || !selectedRoom) {
          setHasBooked(false);
          return;
        }

        const response = await axios.get(`/api/bookings/check?email=${userEmail}&roomId=${selectedRoom}`);
        setHasBooked(response.data.hasBooked || false);
      } catch (error) {
        console.error('Error checking booking status:', error);
        setHasBooked(false);
      }
    };

    if (selectedRoom) {
      checkBookingStatus();
    }
  }, [selectedRoom]);

  // Auto slider
  useEffect(() => {
    if (reviews.length === 0) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, reviews]);

  const handlePrev = () => {
    if (isAnimating || reviews.length <= 1) return;
    setIsAnimating(true);
    setAnimationState('fade-prev');

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? reviews.length - 1 : prevIndex - 1));
      setAnimationState('fade-in');
      setIsAnimating(false);
    }, 600);
  };

  const handleNext = () => {
    if (isAnimating || reviews.length <= 1) return;
    setIsAnimating(true);
    setAnimationState('fade-next');

    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex === reviews.length - 1 ? 0 : prevIndex + 1));
      setAnimationState('fade-in');
      setIsAnimating(false);
    }, 600);
  };

  // Xử lý submit đánh giá
  const handleRatingSubmit = async (formData) => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        setSubmitStatus({ type: 'error', message: 'Please log in to submit a review.' });
        return;
      }

      const response = await axios.post(
        '/api/reviews',
        { ...formData, email: userEmail },
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setSubmitStatus({ type: 'success', message: 'Review submitted successfully!' });
      setShowRatingForm(false);

      // Cập nhật lại danh sách đánh giá
      const updatedReviews = await axios.get('/api/reviews', {
        params: { roomId: selectedRoom },
      });
      setReviews(updatedReviews.data);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.message || 'Error submitting review. Please try again.',
      });
    }
  };

  return (
    <div className="testimonial-page">
      <Banner />
      <BookingForm />

      <div className="testimonial-section" style={{ backgroundImage: `url('/images/testimonial-bg.jpg')` }}>
        <div className="testimonial-container">
          <h2 className="testimonial-title">
            Customer Reviews{' '}
            {averageRating.totalReviews > 0 && (
              <span>
                (Average: {averageRating.average.toFixed(1)}/5, {averageRating.totalReviews} reviews)
              </span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews available for this room.</p>
          ) : (
            <>
              <button className="nav-btn prev" onClick={handlePrev} disabled={isAnimating || reviews.length <= 1}>
                <div className="arrow-circle">
                  <i className="fas fa-chevron-left"></i>
                </div>
              </button>

              <div className="testimonial-wrapper">
                <div className={`testimonial-cards ${animationState}`}>
                  {reviews.map((review, index) => (
                    <div
                      key={review._id}
                      className={`testimonial-card ${index === currentIndex ? 'active' : ''}`}
                    >
                      <p className="testimonial-text">{review.comment}</p>
                      <div className="testimonial-author">
                        <img
                          src={review.image || 'https://via.placeholder.com/60'}
                          alt={review.userName}
                          className="author-image"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60';
                          }}
                        />
                        <div className="author-info">
                          <h4 className="author-name">{review.userName}</h4>
                          <p className="author-profession">Rating: {review.rating}/5</p>
                        </div>
                      </div>
                      <div className="quote-icon">
                        <i className="fas fa-quote-right"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="nav-btn next" onClick={handleNext} disabled={isAnimating || reviews.length <= 1}>
                <div className="arrow-circle">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </button>
            </>
          )}

          <div className="testimonial-indicator">
            {reviews.map((_, index) => (
              <span
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => !isAnimating && setCurrentIndex(index)}
              ></span>
            ))}
          </div>
        </div>

        <div className="rating-section">
          <button
            className="rating-toggle-btn"
            onClick={() => {
              setShowRatingForm(!showRatingForm);
              setSubmitStatus(null);
            }}
            disabled={hasBooked === null || rooms.length === 0 || !hasBooked}
          >
            {showRatingForm ? 'Hide Rating Form' : 'Leave a Review'}
          </button>

          {hasBooked === null ? (
            <div className="rating-message-container">
              <p className="rating-message">Checking booking status...</p>
            </div>
          ) : !hasBooked ? (
            <div className="rating-message-container">
              <p className="rating-message">You must book this room to leave a review.</p>
            </div>
          ) : showRatingForm ? (
            <RatingForm
              onSubmit={handleRatingSubmit}
              hasBooked={hasBooked}
              rooms={rooms}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
              submitStatus={submitStatus}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Testimonial;