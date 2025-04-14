import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/bookingscreen.css";
import Loader from "../components/Loader";

function Bookingscreen() {
  const { roomid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: "",
    email: "",
    phone: "",
    checkin: "",
    checkout: "",
    adults: 1,
    children: 0,
    roomType: "",
    specialRequest: "",
  });
  const [bookingStatus, setBookingStatus] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post("/api/rooms/getroombyid", { roomid });
        setRoom(data);
        setBookingData((prev) => ({ ...prev, roomType: data.type || "" }));
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
      setLoading(true);
      setBookingStatus(null);
      const response = await axios.post("/api/bookings/bookroom", {
        roomid,
        ...bookingData,
      });
      setBookingStatus({
        type: "success",
        message: "Đặt phòng thành công! Bạn sẽ được chuyển đến trang đánh giá.",
      });
      localStorage.setItem("userEmail", bookingData.email);
      setTimeout(() => {
        navigate(`/testimonial?roomId=${roomid}&showReviewForm=true`);
      }, 2000); // Tăng thời gian chờ để người dùng đọc thông báo
    } catch (error) {
      setBookingStatus({
        type: "error",
        message: "Lỗi khi đặt phòng. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-header text-center">
          <h2 className="subtitle">
            <span className="line"></span>
            ĐẶT PHÒNG
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Đặt một <span>PHÒNG SANG TRỌNG</span>
          </h1>
        </div>

        {loading ? (
          <Loader loading={loading} />
        ) : error ? (
          <h1 className="text-center text-danger">Lỗi khi tải chi tiết phòng...</h1>
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
                          alt={`Phòng ${index + 1}`}
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
                <div className={`alert ${bookingStatus.type === "success" ? "alert-success" : "alert-danger"}`}>
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
                          placeholder="Họ và tên"
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
                          placeholder="Email của bạn"
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
                          placeholder="Số điện thoại"
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
                          placeholder="Ngày nhận phòng"
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
                          placeholder="Ngày trả phòng"
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
                            Chọn số người lớn
                          </option>
                          {[1, 2, 3, 4].map((num) => (
                            <option key={num} value={num}>
                              {num} Người lớn
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
                            Chọn số trẻ em
                          </option>
                          {[0, 1, 2, 3].map((num) => (
                            <option key={num} value={num}>
                              {num} Trẻ em
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
                            Chọn loại phòng
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
                      placeholder="Yêu cầu đặc biệt"
                      rows="3"
                    />
                  </div>
                  <button type="submit" className="btn btn-book-now" disabled={loading}>
                    {loading ? "Đang xử lý..." : "ĐẶT PHÒNG NGAY"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <h1 className="text-center text-danger">Không tìm thấy phòng</h1>
        )}
      </div>
    </div>
  );
}

export default Bookingscreen;