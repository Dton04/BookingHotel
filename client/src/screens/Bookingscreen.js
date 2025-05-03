import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/bookingscreen.css";
import Loader from "../components/Loader";
import CancelConfirmationModal from "../components/CancelConfirmationModal";
import SuggestionCard from "../components/SuggestionCard";
import AlertMessage from "../components/AlertMessage"; // Thêm component AlertMessage
import { Carousel } from "react-bootstrap";

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
    paymentMethod: "cash",
  });
  const [bookingStatus, setBookingStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newBookingId, setNewBookingId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post("/api/rooms/getroombyid", { roomid });
        setRoom(data);
        setBookingData((prev) => ({ ...prev, roomType: data.type || "" }));
        if (data.availabilityStatus !== 'available') {
          await fetchSuggestions(data._id, data.type);
        }
      } catch (error) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomid]);

  useEffect(() => {
    let interval;
    if (bookingId && bookingData.paymentMethod === "bank_transfer") {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`/api/bookings/${bookingId}/payment-deadline`);
          const { timeRemaining: remaining, expired } = response.data;
          setTimeRemaining(remaining);
          setPaymentExpired(expired);

          if (expired) {
            setBookingStatus({
              type: "error",
              message: "Thời gian thanh toán đã hết. Đặt phòng đã bị hủy.",
            });
            setPaymentStatus("canceled");
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra thời gian thanh toán:", error);
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bookingId, bookingData.paymentMethod]);

  const fetchSuggestions = async (roomId, roomType) => {
    try {
      setLoadingSuggestions(true);
      const response = await axios.get("/api/rooms/suggestions", {
        params: { roomId, roomType },
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy phòng gợi ý:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setBookingStatus(null);
      setPaymentStatus(null);
      setBankInfo(null);
      setTimeRemaining(null);
      setPaymentExpired(false);
      const response = await axios.post("/api/bookings/bookroom", {
        roomid,
        ...bookingData,
      });
      setBookingId(response.data.booking._id);
      setNewBookingId(response.data.booking._id);
      setBookingStatus({
        type: "success",
        message: "Đặt phòng thành công! Vui lòng kiểm tra thông tin thanh toán.",
      });
      setPaymentStatus(response.data.booking.paymentStatus);
      
      if (bookingData.paymentMethod === "bank_transfer" && response.data.paymentResult?.bankInfo) {
        setBankInfo(response.data.paymentResult.bankInfo);
      }

      localStorage.setItem("userEmail", bookingData.email);
      localStorage.setItem("bookingId", response.data.booking._id);
      localStorage.setItem("bookedRoomId", roomid);

      if (bookingData.paymentMethod !== "bank_transfer") {
        setTimeout(() => {
          navigate(`/testimonial?roomId=${roomid}&showReviewForm=true`);
        }, 5000);
      }
    } catch (error) {
      setBookingStatus({
        type: "error",
        message: error.response?.data?.message || "Lỗi khi đặt phòng. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm giả lập thanh toán thành công
  const handleSimulatePayment = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      await axios.put(`/api/bookings/${bookingId}/confirm`);
      setPaymentStatus("paid");
      setBookingStatus({
        type: "success",
        message: "Thanh toán thành công! Đang chuyển hướng đến trang đánh giá...",
      });
      setTimeout(() => {
        navigate(`/testimonial?roomId=${roomid}&showReviewForm=true`);
      }, 2000);
    } catch (error) {
      console.error("Lỗi khi giả lập thanh toán:", error);
      setBookingStatus({
        type: "error",
        message: "Lỗi khi giả lập thanh toán. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentStatus = () => {
    if (!paymentStatus) return null;
    let iconClass, statusText;
    switch (paymentStatus) {
      case "paid":
        iconClass = "fas fa-check-circle text-success";
        statusText = "Đã thanh toán";
        break;
      case "pending":
        iconClass = "fas fa-hourglass-half text-warning";
        statusText = "Đang chờ thanh toán";
        break;
      case "canceled":
        iconClass = "fas fa-times-circle text-danger";
        statusText = "Đã hủy";
        break;
      default:
        return null;
    }
    return (
      <div className="payment-status d-flex align-items-center mt-3">
        <i className={`${iconClass} me-2`} style={{ fontSize: "24px" }}></i>
        <span className="status-text">{statusText}</span>
      </div>
    );
  };

  const renderBankInfo = () => {
    if (!bankInfo) return null;
    return (
      <div className="bank-info mt-3 p-3 border rounded">
        <h4>Thông tin thanh toán qua ngân hàng</h4>
        <p><strong>Ngân hàng:</strong> {bankInfo.bankName}</p>
        <p><strong>Số tài khoản:</strong> {bankInfo.accountNumber}</p>
        <p><strong>Chủ tài khoản:</strong> {bankInfo.accountHolder}</p>
        <p><strong>Số tiền:</strong> {bankInfo.amount.toLocaleString()} VND</p>
        <p><strong>Nội dung chuyển khoản:</strong> {bankInfo.content}</p>
        {timeRemaining !== null && !paymentExpired && (
          <p><strong>Thời gian còn lại:</strong> {Math.floor(timeRemaining / 60)} phút {timeRemaining % 60} giây</p>
        )}
        <p className="text-warning">Vui lòng chuyển khoản để hoàn tất thanh toán. Đặt phòng sẽ được xác nhận sau khi chúng tôi nhận được tiền.</p>
        {/* Nút giả lập thanh toán */}
        {!paymentExpired && paymentStatus === "pending" && (
          <button
            className="btn btn-primary mt-3"
            onClick={handleSimulatePayment}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Giả lập thanh toán thành công"}
          </button>
        )}
      </div>
    );
  };

  const handleOpenCancelModal = () => {
    setShowCancelModal(true);
  };

  const handleConfirmSuccess = () => {
    setShowCancelModal(false);
    setBookingStatus({
      type: "success",
      message: "Đã hủy đặt phòng thành công.",
    });
    setNewBookingId(null);
  };

  const handleCloseAlert = () => {
    setBookingStatus(null);
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

        <AlertMessage
          type={bookingStatus?.type}
          message={bookingStatus?.message}
          onClose={handleCloseAlert}
        />

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
                      <div className="image-container">
                        <img
                          src={url || `https://via.placeholder.com/300x200?text=Image+${index + 1}`}
                          alt={`Phòng ${index + 1}`}
                          className="img-fluid room-image"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/300x200?text=Image+${index + 1}`;
                          }}
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
              {renderPaymentStatus()}
              {renderBankInfo()}
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
                          min={new Date().toISOString().split("T")[0]}
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
                          min={bookingData.checkin ? new Date(new Date(bookingData.checkin).setDate(new Date(bookingData.checkin).getDate() + 1)).toISOString().split("T")[0] : ""}
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
                    <label htmlFor="paymentMethod">Phương thức thanh toán</label>
                    <select
                      className="form-control"
                      name="paymentMethod"
                      value={bookingData.paymentMethod}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="credit_card">Thẻ tín dụng</option>
                      <option value="bank_transfer">Tài khoản ngân hàng</option>
                      <option value="mobile_payment">MoMo</option>
                    </select>
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
                  <button
                    type="submit"
                    className="btn btn-book-now"
                    disabled={loading || room.availabilityStatus !== 'available'}
                  >
                    {loading ? "Đang xử lý..." : "ĐẶT PHÒNG NGAY"}
                  </button>
                  {bookingStatus?.type === "success" && newBookingId && (
                    <button
                      type="button"
                      className="btn btn-danger mt-2"
                      onClick={handleOpenCancelModal}
                    >
                      Hủy Đặt Phòng
                    </button>
                  )}
                </form>
              </div>
              {room.availabilityStatus !== 'available' && (
                <div className="suggestions-container">
                  <h5>Phòng tương tự</h5>
                  {loadingSuggestions ? (
                    <p>Đang tải phòng gợi ý...</p>
                  ) : suggestions.length > 0 ? (
                    <Carousel indicators={false} controls={true} interval={null}>
                      {suggestions.reduce((acc, suggestion, index) => {
                        if (index % 2 === 0) {
                          acc.push(
                            <Carousel.Item key={index}>
                              <div className="d-flex justify-content-center">
                                <SuggestionCard room={suggestions[index]} />
                                {suggestions[index + 1] && (
                                  <SuggestionCard room={suggestions[index + 1]} />
                                )}
                              </div>
                            </Carousel.Item>
                          );
                        }
                        return acc;
                      }, [])}
                    </Carousel>
                  ) : (
                    <p>Không tìm thấy phòng tương tự.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <h1 className="text-center text-danger">Không tìm thấy phòng</h1>
        )}
      </div>
      <CancelConfirmationModal
        show={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmSuccess={handleConfirmSuccess}
        bookingId={newBookingId}
        bookingDetails={{
          roomName: room?.name,
          checkin: bookingData.checkin,
          checkout: bookingData.checkout,
        }}
      />
    </div>
  );
}

export default Bookingscreen;