import React, { useState, useEffect } from "react";
import { Modal, Button, Carousel, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Rating from "react-rating";

function Room({ room }) {
  const [show, setShow] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState({ average: 0, totalReviews: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setShow(false);
  const handleShow = async () => {
    setShow(true);
    await Promise.all([fetchReviews(), fetchAverageRating()]);
  };

  const handleBooking = () => {
    navigate(`/book/${room._id}`);
  };

  const formatPriceVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 1000000);
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await axios.get("/api/reviews", {
        params: { roomId: room._id },
      });
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchAverageRating = async () => {
    try {
      const response = await axios.get("/api/reviews/average", {
        params: { roomId: room._id },
      });
      setAverageRating(response.data);
    } catch (error) {
      console.error("Error fetching average rating:", error);
    }
  };

  return (
    <div className="room-card">
      <div className="room-image">
        <img
          src={room.imageurls?.[0] || "/images/default-room.jpg"}
          alt={room.name}
          className="img-fluid"
          onError={(e) => {
            e.target.src = "/images/default-room.jpg";
          }}
        />
        <div className="room-badge">{room.type}</div>
        <div className="room-price-tag">{formatPriceVND(room.rentperday)}</div>
      </div>

      <div className="room-content">
        <h3 className="room-title">{room.name}</h3>

        <div className="room-features">
          <span>
            <i className="fas fa-bed"></i> {room.beds || "3"} Giường
          </span>
          <span>
            <i className="fas fa-bath"></i> {room.baths || "2"} Phòng tắm
          </span>
          <span>
            <i className="fas fa-wifi"></i> WiFi
          </span>
        </div>

        <p className="room-description">
          {room.description?.substring(0, 100) ||
            "Erat Ipsum justo amet duo et elit dolor, est duo duo eos lorem sed diam atet diam sed siet lorem."}
          ...
        </p>

        <div className="room-footer">
          <div className="room-rating">
            <Rating
              readonly
              initialRating={averageRating.average}
              emptySymbol={<i className="far fa-star"></i>}
              fullSymbol={<i className="fas fa-star"></i>}
            />
            <span>({averageRating.totalReviews} đánh giá)</span>
          </div>

          <div className="room-actions">
            <button className="btn btn-view" onClick={handleShow}>
              Chi tiết
            </button>
            <button className="btn btn-book" onClick={handleBooking}>
              Đặt ngay
            </button>
          </div>
        </div>
      </div>

      {/* Modal chi tiết phòng */}
      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{room.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel fade indicators={false}>
            {room.imageurls.map((url, index) => (
              <Carousel.Item key={index}>
                <img
                  className="d-block w-100"
                  src={url}
                  alt={`slide-${index}`}
                  style={{ height: "400px", objectFit: "cover" }}
                />
              </Carousel.Item>
            ))}
          </Carousel>

          <div className="room-modal-content">
            <div className="room-highlights">
              <div>
                <i className="fas fa-bed"></i> {room.beds || "3"} Giường
              </div>
              <div>
                <i className="fas fa-bath"></i> {room.baths || "2"} Phòng tắm
              </div>
              <div>
                <i className="fas fa-wifi"></i> WiFi
              </div>
              <div>
                <i className="fas fa-users"></i> Tối đa: {room.maxcount} người
              </div>
            </div>

            <div className="room-modal-description">
              <h5>Mô tả</h5>
              <p>{room.description || "Không có mô tả chi tiết."}</p>
            </div>

            <div className="room-modal-price">
              <h5>Giá phòng</h5>
              <div className="price">
                {formatPriceVND(room.rentperday)} <span>/ đêm</span>
              </div>
            </div>

            <div className="room-reviews">
              <h5>
                Đánh giá ({averageRating.totalReviews})
              </h5>
              {loadingReviews ? (
                <p>Đang tải đánh giá...</p>
              ) : reviews.length > 0 ? (
                <div className="review-list">
                  {reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <Rating
                          readonly
                          initialRating={review.rating}
                          emptySymbol={<i className="far fa-star"></i>}
                          fullSymbol={<i className="fas fa-star"></i>}
                        />
                        <span>{review.userName || "Khách ẩn danh"}</span>
                      </div>
                      <p className="review-text">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Chưa có đánh giá nào.</p>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleBooking}>
            Đặt phòng ngay
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Room;