import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Banner from "../Banner";
import RatingForm from "../RatingForm";
import axios from "axios";
import "../../css/testimonial.css";

function Testimonial() {
  const [reviews, setReviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationState, setAnimationState] = useState("fade-in");
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasBooked, setHasBooked] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkoutDate, setCheckoutDate] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [rooms, setRooms] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      roomId: params.get("roomId"),
      showReviewForm: params.get("showReviewForm") === "true",
    };
  };

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/api/rooms/getallrooms");
        setRooms(response.data);
        const { roomId } = getQueryParams();
        if (response.data.length > 0) {
          setSelectedRoom(roomId || response.data[0]._id);
        } else {
          setError("Không tìm thấy phòng nào.");
        }
      } catch (error) {
        setError("Không thể tải danh sách phòng. Vui lòng thử lại.");
        console.error("Lỗi khi lấy danh sách phòng:", {
          message: error.message,
          response: error.response?.data,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const checkBookingStatus = async () => {
    try {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail || !selectedRoom) {
        setHasBooked(false);
        setPaymentStatus(null);
        setCheckoutDate(null);
        setCanReview(false);
        return;
      }

      // Kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        setError("Email không hợp lệ trong localStorage.");
        setHasBooked(false);
        setPaymentStatus(null);
        setCheckoutDate(null);
        setCanReview(false);
        return;
      }

      const response = await axios.get(`/api/bookings/check`, {
        params: { email: userEmail, roomId: selectedRoom },
      });

      const { hasBooked, paymentStatus, booking } = response.data;
      setHasBooked(hasBooked || false);
      setPaymentStatus(paymentStatus || null);
      setCheckoutDate(booking?.checkout || null);

      const currentDate = new Date();
      const checkout = booking?.checkout ? new Date(booking.checkout) : null;
      setCanReview(hasBooked && paymentStatus === "paid" && checkout && currentDate >= checkout);
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái đặt phòng:", {
        message: error.message,
        response: error.response?.data,
      });
      setError("Không thể kiểm tra trạng thái đặt phòng. Vui lòng thử lại.");
      setHasBooked(false);
      setPaymentStatus(null);
      setCheckoutDate(null);
      setCanReview(false);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      checkBookingStatus();
    }
  }, [selectedRoom]);

  useEffect(() => {
    let interval;
    if (hasBooked && paymentStatus === "pending") {
      interval = setInterval(async () => {
        await checkBookingStatus();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [hasBooked, paymentStatus]);

  useEffect(() => {
    const { showReviewForm } = getQueryParams();
    if (showReviewForm && canReview) {
      setShowRatingForm(true);
    }
  }, [hasBooked, paymentStatus, checkoutDate]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedRoom) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/api/reviews", {
          params: { roomId: selectedRoom },
        });
        setReviews(response.data.reviews || []); // Đảm bảo reviews là mảng
        setCurrentIndex(0);
      } catch (error) {
        setError("Không thể tải đánh giá. Vui lòng thử lại.");
        console.error("Lỗi khi lấy đánh giá:", {
          message: error.message,
          response: error.response?.data,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [selectedRoom]);

  useEffect(() => {
    const fetchAverageRating = async () => {
      if (!selectedRoom) return;
      try {
        const response = await axios.get("/api/reviews/average", {
          params: { roomId: selectedRoom },
        });
        setAverageRating(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy điểm trung bình:", {
          message: error.message,
          response: error.response?.data,
        });
        setAverageRating({ average: 0, totalReviews: 0 });
      }
    };

    fetchAverageRating();
  }, [selectedRoom]);

  const groupCount = Math.ceil(reviews.length / 2);

  useEffect(() => {
    if (groupCount <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [groupCount]);

  const handlePrev = () => {
    if (isAnimating || groupCount <= 1) return;
    setIsAnimating(true);
    setAnimationState("fade-prev");

    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? (groupCount - 1) * 2 : prevIndex - 2
      );
      setAnimationState("fade-in");
      setIsAnimating(false);
    }, 600);
  };

  const handleNext = () => {
    if (isAnimating || groupCount <= 1) return;
    setIsAnimating(true);
    setAnimationState("fade-next");

    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === (groupCount - 1) * 2 ? 0 : prevIndex + 2
      );
      setAnimationState("fade-in");
      setIsAnimating(false);
    }, 600);
  };

  const handleRatingSubmit = async (formData) => {
    try {
      setLoading(true);
      setSubmitStatus(null);

      const ratingValue = parseInt(formData.rating, 10);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        setSubmitStatus({
          type: "error",
          message: "Điểm đánh giá phải từ 1 đến 5",
        });
        setLoading(false);
        return;
      }

      const reviewData = {
        roomId: selectedRoom,
        userName: formData.userName || "Ẩn danh",
        email: localStorage.getItem("userEmail") || formData.email || "",
        rating: ratingValue,
        comment: formData.comment || "",
      };

      const response = await axios.post("/api/reviews", reviewData);
      setSubmitStatus({ type: "success", message: "Gửi đánh giá thành công!" });
      setShowRatingForm(false);

      const updatedReviews = await axios.get("/api/reviews", {
        params: { roomId: selectedRoom },
      });
      setReviews(updatedReviews.data.reviews || []);

      const updatedAverage = await axios.get("/api/reviews/average", {
        params: { roomId: selectedRoom },
      });
      setAverageRating(updatedAverage.data);

      localStorage.removeItem("userEmail");
      localStorage.removeItem("hasBooked");
      localStorage.removeItem("bookedRoomId");
      localStorage.removeItem("bookingId");

      setTimeout(() => {
        navigate("/rooms");
      }, 2000);
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", {
        message: error.message,
        response: error.response?.data,
      });
      setSubmitStatus({
        type: "error",
        message: error.response?.data?.message || "Gửi đánh giá thất bại, vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  const displayedReviews = reviews.slice(currentIndex, currentIndex + 2);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`fas fa-star ${i <= rating ? "star-filled" : "star-empty"}`}
        ></i>
      );
    }
    return stars;
  };

  return (
    <div className="testimonial-page">
      <Banner />
      <div className="divider"></div>

      <div className="testimonial-section">
        <div className="testimonial-container">
          <h2 className="testimonial-title">
            Đánh giá từ khách hàng{" "}
            {averageRating.totalReviews > 0 && (
              <span>
                (Trung bình: {averageRating.average.toFixed(1)}/5,{" "}
                {averageRating.totalReviews} lượt)
              </span>
            )}
          </h2>

          {loading ? (
            <p className="loading-text">Đang tải dữ liệu...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : reviews.length === 0 ? (
            <p className="no-reviews">Chưa có đánh giá nào cho phòng này.</p>
          ) : (
            <>
              <button
                className="nav-btn prev"
                onClick={handlePrev}
                disabled={isAnimating || groupCount <= 1}
              >
                <div className="arrow-circle">
                  <i className="fas fa-chevron-left"></i>
                </div>
              </button>

              <div className="testimonial-wrapper">
                <div className={`testimonial-cards ${animationState}`}>
                  {displayedReviews.map((review) => (
                    <div
                      key={review._id}
                      className="testimonial-card"
                    >
                      <div className="testimonial-content">
                        <p className="testimonial-text">{review.comment}</p>
                        {review.image && (
                          <div className="review-image-container">
                            <img
                              src={review.image}
                              alt="Review"
                              className="review-image"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/400";
                              }}
                            />
                          </div>
                        )}
                        <div className="testimonial-author">
                          <div className="author-info">
                            <h4 className="author-name">{review.userName}</h4>
                            <p className="author-profession">
                              {review.profession || "Khách hàng"}
                            </p>
                            <div className="star-rating">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="nav-btn next"
                onClick={handleNext}
                disabled={isAnimating || groupCount <= 1}
              >
                <div className="arrow-circle">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </button>
            </>
          )}

          <div className="testimonial-indicator">
            {Array.from({ length: groupCount }).map((_, index) => (
              <span
                key={index}
                className={`indicator ${
                  currentIndex / 2 === index ? "active" : ""
                }`}
                onClick={() => !isAnimating && setCurrentIndex(index * 2)}
              ></span>
            ))}
          </div>
        </div>

        <div className="rating-section">
          <div className="room-selector">
            <label htmlFor="roomSelect">Chọn phòng: </label>
            <select
              id="roomSelect"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              disabled={loading || rooms.length === 0}
            >
              <option value="" disabled>
                Chọn một phòng
              </option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {hasBooked === null ? (
            <div className="rating-message-container">
              <p className="rating-message">Đang kiểm tra trạng thái đặt phòng...</p>
            </div>
          ) : !hasBooked ? (
            <div className="rating-message-container">
              <p className="rating-message">
                Bạn cần đặt phòng này để có thể đánh giá.
              </p>
            </div>
          ) : paymentStatus === "pending" ? (
            <div className="rating-message-container">
              <p className="rating-message">
                Đang chờ xác nhận thanh toán qua ngân hàng. Vui lòng đợi.
              </p>
            </div>
          ) : paymentStatus === "canceled" ? (
            <div className="rating-message-container">
              <p className="rating-message">
                Đặt phòng đã bị hủy do không thanh toán kịp thời. Bạn không thể đánh giá.
              </p>
            </div>
          ) : paymentStatus !== "paid" ? (
            <div className="rating-message-container">
              <p className="rating-message">
                Bạn cần hoàn tất thanh toán để có thể đánh giá.
              </p>
            </div>
          ) : !canReview ? (
            <div className="rating-message-container">
              <p className="rating-message">
                Bạn chỉ có thể đánh giá sau khi trả phòng (ngày {new Date(checkoutDate).toLocaleDateString()}).
              </p>
            </div>
          ) : (
            <>
              <button
                className="rating-toggle-btn"
                onClick={() => {
                  setShowRatingForm(!showRatingForm);
                  setSubmitStatus(null);
                }}
                disabled={loading || rooms.length === 0}
              >
                {showRatingForm ? "Ẩn form đánh giá" : "Gửi đánh giá"}
              </button>

              {showRatingForm && (
                <RatingForm
                  onSubmit={handleRatingSubmit}
                  hasBooked={hasBooked}
                  rooms={rooms}
                  selectedRoom={selectedRoom}
                  setSelectedRoom={setSelectedRoom}
                  submitStatus={submitStatus}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Testimonial;