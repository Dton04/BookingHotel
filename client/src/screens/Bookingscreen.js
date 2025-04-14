import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../css/bookingscreen.css';
import Loader from '../components/Loader';

function Bookingscreen() {
  const { roomid } = useParams();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    checkin: '',
    checkout: '',
    adults: 1,
    children: 0,
    roomType: '',
    specialRequest: '',
  });
  const [bookingStatus, setBookingStatus] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
  });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post('/api/rooms/getroombyid', { roomid });
        setRoom(data);
        setBookingData((prev) => ({ ...prev, roomType: data.type || '' }));
      } catch (error) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomid]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/bookings/bookroom', {
        roomid,
        ...bookingData,
      });
      setBookingStatus({ type: 'success', message: 'Booking successful!' });
      setShowReviewForm(true); // Hiển thị form đánh giá sau khi đặt phòng
      setBookingData({
        name: '',
        email: '',
        phone: '',
        checkin: '',
        checkout: '',
        adults: 1,
        children: 0,
        roomType: room?.type || '',
        specialRequest: '',
      });
    } catch (error) {
      setBookingStatus({ type: 'error', message: 'Error booking room. Please try again.' });
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reviews/submit', {
        roomId: roomid,
        userName: bookingData.name || 'Anonymous',
        rating: Number(reviewData.rating),
        comment: reviewData.comment,
      });
      setReviewData({ rating: 0, comment: '' });
      setShowReviewForm(false);
      setBookingStatus({ type: 'success', message: 'Review submitted successfully!' });
    } catch (error) {
      setBookingStatus({ type: 'error', message: 'Error submitting review. Please try again.' });
    }
  };

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-header text-center">
          <h2 className="subtitle">
            <span className="line"></span>
            ROOM BOOKING
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Book A <span>LUXURY</span> ROOM
          </h1>
        </div>

        {loading ? (
          <Loader loading={loading} />
        ) : error ? (
          <h1 className="text-center text-danger">Error loading room details...</h1>
        ) : room ? (
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="booking-images">
                <div className="row">
                  {room.imageurls.slice(0, 4).map((url, index) => (
                    <div key={index} className="col-6 mb-3">
                      <div className="image-wrapper">
                        <img
                          src={url || `https://via.placeholder.com/300x200?text=Image+${index + 1}`}
                          alt={`Hotel ${index + 1}`}
                          className="img-fluid"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              {bookingStatus && (
                <div className={`alert ${bookingStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                  {bookingStatus.message}
                </div>
              )}
              <div className="booking-screen-wrapper">
                {!showReviewForm ? (
                  <form className="booking-screen" onSubmit={handleBooking}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={bookingData.name}
                            onChange={handleInputChange}
                            placeholder="Your Name"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={bookingData.email}
                            onChange={handleInputChange}
                            placeholder="Your Email"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <input
                            type="tel"
                            className="form-control"
                            name="phone"
                            value={bookingData.phone}
                            onChange={handleInputChange}
                            placeholder="Your Phone"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <input
                            type="date"
                            className="form-control"
                            name="checkin"
                            value={bookingData.checkin}
                            onChange={handleInputChange}
                            placeholder="Check In"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <input
                            type="date"
                            className="form-control"
                            name="checkout"
                            value={bookingData.checkout}
                            onChange={handleInputChange}
                            placeholder="Check Out"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <select
                            className="form-control"
                            name="adults"
                            value={bookingData.adults}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="" disabled>
                              Select Adult
                            </option>
                            {[1, 2, 3, 4].map((num) => (
                              <option key={num} value={num}>
                                Adult {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <select
                            className="form-control"
                            name="children"
                            value={bookingData.children}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="" disabled>
                              Select Child
                            </option>
                            {[0, 1, 2, 3].map((num) => (
                              <option key={num} value={num}>
                                Child {num}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <select
                            className="form-control"
                            name="roomType"
                            value={bookingData.roomType}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="" disabled>
                              Select A Room
                            </option>
                            <option value={room.type}>{room.type}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <textarea
                        className="form-control"
                        name="specialRequest"
                        value={bookingData.specialRequest}
                        onChange={handleInputChange}
                        placeholder="Special Request"
                        rows="3"
                      />
                    </div>
                    <button type="submit" className="btn btn-book-now">
                      BOOK NOW
                    </button>
                  </form>
                ) : (
                  <form className="review-form" onSubmit={handleReviewSubmit}>
                    <h3>Leave a Review</h3>
                    <div className="form-group">
                      <label>Rating (1-5):</label>
                      <input
                        type="number"
                        className="form-control"
                        name="rating"
                        value={reviewData.rating}
                        onChange={handleReviewInputChange}
                        min="1"
                        max="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Comment:</label>
                      <textarea
                        className="form-control"
                        name="comment"
                        value={reviewData.comment}
                        onChange={handleReviewInputChange}
                        placeholder="Your feedback"
                        rows="4"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-book-now">
                      Submit Review
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary mt-2"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ) : (
          <h1 className="text-center text-danger">Room not found</h1>
        )}
      </div>
    </div>
  );
}

export default Bookingscreen;