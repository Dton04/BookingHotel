import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Banner from "../Banner";
import BookingForm from "../BookingForm";
import RatingForm from "../RatingForm";
import axios from "axios";
import "../../css/testimonial.css";

function Testimonial() {
  const [reviews, setReviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationState, setAnimationState] = useState("fade-in");
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasBooked, setHasBooked] = useState(null);
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

  // Fetch danh sách phòng
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
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Kiểm tra trạng thái đặt phòng
  useEffect(() => {
    const checkBookingStatus = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (!userEmail || !selectedRoom) {
          setHasBooked(false);
          return;
        }

        const response = await axios.get(`/api/bookings/check`, {
          params: { email: userEmail, roomId: selectedRoom },
        });
        setHasBooked(response.data.hasBooked || false);
      } catch (error) {
        console.error("Error checking booking status:", error);
        setHasBooked(false);
      }
    };

    if (selectedRoom) {
      checkBookingStatus();
    }
  }, [selectedRoom]);

  // Xử lý showReviewForm từ query
  useEffect(() => {
    const { showReviewForm } = getQueryParams();
    if (showReviewForm && hasBooked) {
      setShowRatingForm(true);
    }
  }, [hasBooked]);

  // Fetch danh sách đánh giá
  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedRoom) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/api/reviews", {
          params: { roomId: selectedRoom },
        });
        setReviews(response.data);
      } catch (error) {
        setError("Không thể tải đánh giá. Vui lòng thử lại.");
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [selectedRoom]);

  // Fetch điểm trung bình đánh giá
  useEffect(() => {
    const fetchAverageRating = async () => {
      if (!selectedRoom) return;
      try {
        const response = await axios.get("/api/reviews/average", {
          params: { roomId: selectedRoom },
        });
        setAverageRating(response.data);
      } catch (error) {
        console.error("Error fetching average rating:", error);
        setAverageRating({ average: 0, totalReviews: 0 });
      }
    };

    fetchAverageRating();
  }, [selectedRoom]);

  // Auto slider
  useEffect(() => {
    if (reviews.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, reviews]);

  const handlePrev = () => {
    if (isAnimating || reviews.length <= 1) return;
    setIsAnimating(true);
    setAnimationState("fade-prev");

    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
      );
      setAnimationState("fade-in");
      setIsAnimating(false);
    }, 600);
  };

  const handleNext = () => {
    if (isAnimating || reviews.length <= 1) return;
    setIsAnimating(true);
    setAnimationState("fade-next");

    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
      );
      setAnimationState("fade-in");
      setIsAnimating(false);
    }, 600);
  };

  const handleRatingSubmit = async (formData) => {
    try {
      setLoading(true);
      setSubmitStatus(null);

      // Chuyển đổi rating thành số và kiểm tra giá trị hợp lệ
      const ratingValue = parseInt(formData.rating, 10);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        setSubmitStatus({
          type: "error",
          message: "Điểm đánh giá phải từ 1 đến 5",
        });
        setLoading(false);
        return;
      }

      // Đảm bảo formData chứa đầy đủ các trường
      const reviewData = {
        roomId: selectedRoom,
        userName: formData.userName || "Ẩn danh",
        email: localStorage.getItem("userEmail") || formData.email || "",
        rating: ratingValue, // Sử dụng giá trị đã chuyển đổi
        comment: formData.comment || "",
      };

      console.log("Sending review data:", reviewData); // Log để debug

      const response = await axios.post("/api/reviews", reviewData);
      setSubmitStatus({ type: "success", message: "Gửi đánh giá thành công!" });
      setShowRatingForm(false);

      // Cập nhật danh sách đánh giá và điểm trung bình
      const updatedReviews = await axios.get("/api/reviews", {
        params: { roomId: selectedRoom },
      });
      setReviews(updatedReviews.data);

      const updatedAverage = await axios.get("/api/reviews/average", {
        params: { roomId: selectedRoom },
      });
      setAverageRating(updatedAverage.data);

      // Xóa localStorage sau khi gửi đánh giá
      localStorage.removeItem("userEmail");
      localStorage.removeItem("hasBooked");
      localStorage.removeItem("bookedRoomId");

      // Chuyển hướng về trang phòng sau khi gửi đánh giá thành công
      setTimeout(() => {
        navigate("/rooms");
      }, 2000);
    } catch (error) {
      console.error("Error submitting review:", error);
      setSubmitStatus({
        type: "error",
        message: error.response?.data?.message || "Gửi đánh giá thất bại, vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="testimonial-page">
      <Banner />
      <BookingForm />

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
                disabled={isAnimating || reviews.length <= 1}
              >
                <div className="arrow-circle">
                  <i className="fas fa-chevron-left"></i>
                </div>
              </button>

              <div className="testimonial-wrapper">
                <div className={`testimonial-cards ${animationState}`}>
                  {reviews.map((review, index) => (
                    <div
                      key={review._id}
                      className={`testimonial-card ${
                        index === currentIndex ? "active" : ""
                      }`}
                    >
                      <p className="testimonial-text">{review.comment}</p>
                      <div className="testimonial-author">
                        <img
                          src={review.image || "https://via.placeholder.com/60"}
                          alt={review.userName}
                          className="author-image"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/60";
                          }}
                        />
                        <div className="author-info">
                          <h4 className="author-name">{review.userName}</h4>
                          <p className="author-profession">
                            Đánh giá: {review.rating}/5
                          </p>
                        </div>
                      </div>
                      <div className="quote-icon">
                        <i className="fas fa-quote-right"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="nav-btn next"
                onClick={handleNext}
                disabled={isAnimating || reviews.length <= 1}
              >
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
                className={`indicator ${index === currentIndex ? "active" : ""}`}
                onClick={() => !isAnimating && setCurrentIndex(index)}
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