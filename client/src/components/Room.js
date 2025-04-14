// Room.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Carousel, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Room({ room }) {
  const [show, setShow] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [newReview, setNewReview] = useState({
    userName: '',
    rating: 0,
    comment: '',
    image: null,
  });
  const [hasBooked, setHasBooked] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true);
    fetchReviews();
    checkBooking();
  };
  const handleBooking = () => {
    navigate(`/book/${room._id}`);
  };

  const formatPriceVND = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 1000000);
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/reviews?roomId=${room._id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchAverageRating = async () => {
    try {
      const response = await axios.get(`/api/reviews/average?roomId=${room._id}`);
      setAverageRating(response.data.average);
      setTotalReviews(response.data.totalReviews);
    } catch (error) {
      console.error('Error fetching average rating:', error);
    }
  };
  

  const checkBooking = async () => {
    try {
      const userId = localStorage.getItem('userEmail'); 
      if (!userId) {
        setHasBooked(false);
        return;
      }
      const response = await axios.get(`/api/bookings/check?userId=${userId}&roomId=${room._id}`);
      setHasBooked(response.data.hasBooked);
    } catch (error) {
      console.error('Error checking booking:', error);
      setHasBooked(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('roomId', room._id);
      formData.append('userName', newReview.userName);
      formData.append('rating', newReview.rating);
      formData.append('comment', newReview.comment);
      if (newReview.image) {
        formData.append('image', newReview.image);
      }

      await axios.post('/api/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setNewReview({ userName: '', rating: 0, comment: '', image: null });
      fetchReviews();
      fetchAverageRating();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  useEffect(() => {
    fetchAverageRating();
  }, []);

  return (
    <div className="room-card">
      <div className="room-image">
        <img
          src={room.imageurls?.[0] || "default-image.jpg"}
          alt={room.name}
          className="img-fluid"
          onError={(e) => { e.target.src = "default-image.jpg"; }}
        />
      </div>
      <div className="room-content">
        <h4 className="room-title">{room.name}</h4>
        <p className="room-description">{room.description?.substring(0, 100)}...</p>
        <div className="room-details">
          <span className="room-price">{formatPriceVND(room.rentperday)} / Đêm</span>
          <div className="room-rating">
            <span className="average-rating">
              {'★'.repeat(Math.round(averageRating))}{'☆'.repeat(5 - Math.round(averageRating))}
            </span>
            <span className="total-reviews">({totalReviews} đánh giá)</span>
          </div>
          <button className="btn btn-details" onClick={handleShow}>Chi tiết</button>
        </div>
      </div>

      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{room.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel data-bs-theme="dark">
            {room.imageurls.map((url, index) => (
              <Carousel.Item key={index}>
                <img className="d-block w-100 bigimg" src={url} alt={`slide-${index}`} />
              </Carousel.Item>
            ))}
          </Carousel>
          <p className="mt-3">{room.description}</p>
          <ul className="room-info">
            <li>Số lượng tối đa: {room.maxcount}</li>
            <li>Số điện thoại: {room.phonenumber}</li>
            <li>Loại: {room.type}</li>
            <li>Giá: {formatPriceVND(room.rentperday)} / Đêm</li>
          </ul>

          <div className="reviews-section mt-4">
            <h5>Đánh giá</h5>
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={index} className="review-item mb-3">
                  <div className="review-header">
                    <span className="review-user">{review.userName}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="review-rating">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  {review.image && (
                    <img
                      src={review.image}
                      alt="Review"
                      className="review-image"
                      style={{ maxWidth: '200px', marginTop: '10px' }}
                    />
                  )}
                </div>
              ))
            ) : (
              <p>Chưa có đánh giá nào cho phòng này.</p>
            )}
          </div>

          {/* Form gửi đánh giá */}
          <div className="review-form mt-4">
            <h5>Gửi đánh giá của bạn</h5>
            {hasBooked ? (
              <Form onSubmit={handleReviewSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên của bạn</Form.Label>
                  <Form.Control
                    type="text"
                    value={newReview.userName}
                    onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Đánh giá (1-5 sao)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="5"
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Bình luận</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Ảnh minh họa</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewReview({ ...newReview, image: e.target.files[0] })}
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  Gửi đánh giá
                </Button>
              </Form>
            ) : (
              <p>Bạn cần đặt phòng này trước khi gửi đánh giá.</p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Đóng</Button>
          <Button variant="success" onClick={handleBooking}>Đặt ngay</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Room;