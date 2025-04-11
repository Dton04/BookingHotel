import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../css/bookingscreen.css'; // Import CSS file for styling



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

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/bookings/bookroom', {
        roomid,
        ...bookingData,
      });
      setBookingStatus({ type: 'success', message: 'Booking successful!' });
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

  return (
    <div className="booking-page">
      <div className="container">
        {/* Tiêu đề */}
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
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <h1 className="text-center text-danger">Error loading room details...</h1>
        ) : room ? (
          <div className="row align-items-center">
            {/* Hình ảnh minh họa bên trái */}
            <div className="col-md-6">
              <div className="booking-images">
                <div className="row">
                  <div className="col-6 mb-3">
                    <div className="image-wrapper">
                      <img
                        src={room.imageurls[0] || 'https://via.placeholder.com/300x200?text=Image+1'}
                        alt="Hotel 1"
                        className="img-fluid"
                      />
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="image-wrapper">
                      <img
                        src={room.imageurls[1] || 'https://via.placeholder.com/300x200?text=Image+2'}
                        alt="Hotel 2"
                        className="img-fluid"
                      />
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="image-wrapper">
                      <img
                        src={room.imageurls[2] || 'https://via.placeholder.com/300x200?text=Image+3'}
                        alt="Hotel 3"
                        className="img-fluid"
                      />
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="image-wrapper">
                      <img
                        src={room.imageurls[3] || 'https://via.placeholder.com/300x200?text=Image+4'}
                        alt="Hotel 4"
                        className="img-fluid"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form đặt phòng bên phải */}
            <div className="col-md-6">
              {bookingStatus && (
                <div className={`alert ${bookingStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                  {bookingStatus.message}
                </div>
              )}
              <div className="booking-screen-wrapper">
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
                  </div>
                  <div className="row">
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
                          <option value="1">Adult 1</option>
                          <option value="2">Adult 2</option>
                          <option value="3">Adult 3</option>
                          <option value="4">Adult 4</option>
                        </select>
                      </div>
                    </div>
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
                          <option value="0">Child 0</option>
                          <option value="1">Child 1</option>
                          <option value="2">Child 2</option>
                          <option value="3">Child 3</option>
                        </select>
                      </div>
                    </div>
                  </div>
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
                  <div className="form-group">
                    <textarea
                      className="form-control"
                      name="specialRequest"
                      value={bookingData.specialRequest}
                      onChange={handleInputChange}
                      placeholder="Special Request"
                      rows="3"
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-book-now">
                    BOOK NOW
                  </button>
                </form>
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