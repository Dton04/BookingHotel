import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import "../css/bookingscreen.css";
import Loader from "../components/Loader";
import CancelConfirmationModal from "../components/CancelConfirmationModal";
import SuggestionCard from "../components/SuggestionCard";
import AlertMessage from "../components/AlertMessage";
import { Carousel } from "react-bootstrap";

// Định nghĩa schema xác thực
const bookingSchema = yup.object().shape({
  name: yup.string().required("Vui lòng nhập họ và tên").min(2, "Tên phải có ít nhất 2 ký tự"),
  email: yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  phone: yup
    .string()
    .required("Vui lòng nhập số điện thoại"),
  checkin: yup.date().required("Vui lòng chọn ngày nhận phòng"),
  checkout: yup
    .date()
    .required("Vui lòng chọn ngày trả phòng")
    .min(yup.ref("checkin"), "Ngày trả phòng phải sau ngày nhận phòng"),
  adults: yup.number().required("Vui lòng chọn số người lớn").min(1, "Phải có ít nhất 1 người lớn"),
  children: yup.number().default(0),
  roomType: yup.string().required("Vui lòng chọn loại phòng"),
  specialRequest: yup.string().nullable(),
  paymentMethod: yup
    .string()
    .required("Vui lòng chọn phương thức thanh toán")
    .oneOf(["cash", "credit_card", "bank_transfer", "mobile_payment", "vnpay"], "Phương thức thanh toán không hợp lệ"), // Thêm "vnpay" vào đây
});

function Bookingscreen() {
  const { roomid } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
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
    },
  });

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newBookingId, setNewBookingId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  // Thêm state để lưu bookingDetails
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post("/api/rooms/getroombyid", { roomid });
        setRoom(data);
        setValue("roomType", data.type || "");
        if (data.availabilityStatus !== "available") {
          await fetchSuggestions(data._id, data.type);
        }
      } catch (error) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomid, setValue]);

  useEffect(() => {
    let interval;
    if (bookingId && paymentStatus === "pending" && bankInfo) {
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
          setBookingStatus({
            type: "error",
            message: "Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.",
          });
          clearInterval(interval);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [bookingId, paymentStatus, bankInfo]);

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

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setBookingStatus(null);
      setPaymentStatus(null);
      setBankInfo(null);
      setTimeRemaining(null);
      setPaymentExpired(false);

      // Lưu đặt phòng trước
      const bookingResponse = await axios.post("/api/bookings/bookroom", {
        roomid,
        ...data,
      });

      setBookingId(bookingResponse.data.booking._id);
      setNewBookingId(bookingResponse.data.booking._id);
      // Lưu bookingDetails để sử dụng trong CancelConfirmationModal
      setBookingDetails({
        roomName: room.name,
        checkin: data.checkin,
        checkout: data.checkout,
      });

      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("bookingId", bookingResponse.data.booking._id);
      localStorage.setItem("bookedRoomId", roomid);

      if (data.paymentMethod === "mobile_payment") {
        setBookingStatus({
          type: "info",
          message: "Đang tạo hóa đơn thanh toán MoMo...",
        });

        const orderId = `BOOKING-${roomid}-${new Date().getTime()}`;
        const orderInfo = `Thanh toán đặt phòng ${room.name}`;
        const amount = room.rentperday || 50000;

        const momoResponse = await axios.post("/api/momo/create-payment", {
          amount: amount.toString(),
          orderId,
          orderInfo,
          bookingId: bookingResponse.data.booking._id,
        });

        if (momoResponse.data.payUrl) {
          setBookingStatus({
            type: "success",
            message: "Đang chuyển hướng đến trang thanh toán MoMo. Vui lòng hoàn tất thanh toán.",
          });
          setPaymentStatus("pending");
          window.location.href = momoResponse.data.payUrl;
        } else {
          throw new Error(momoResponse.data.message || "Lỗi khi tạo hóa đơn MoMo");
        }
      } else if (data.paymentMethod === "vnpay") {
        setBookingStatus({
          type: "info",
          message: "Đang tạo hóa đơn thanh toán VNPay...",
        });

        const orderId = `BOOKING-${roomid}-${new Date().getTime()}`;
        const orderInfo = `Thanh toán đặt phòng ${room.name}`;
        const amount = room.rentperday || 50000;

        const vnpayResponse = await axios.post("/api/vnpay/create-payment", {
          amount: amount.toString(),
          orderId,
          orderInfo,
          bookingId: bookingResponse.data.booking._id,
        });

        if (vnpayResponse.data.payUrl) {
          setBookingStatus({
            type: "success",
            message: "Đang chuyển hướng đến trang thanh toán VNPay. Vui lòng hoàn tất thanh toán.",
          });
          setPaymentStatus("pending");
          window.location.href = vnpayResponse.data.payUrl;
        } else {
          throw new Error(vnpayResponse.data.message || "Lỗi khi tạo hóa đơn VNPay");
        }
      } else {
        setBookingStatus({
          type: "success",
          message: "Đặt phòng thành công! Vui lòng kiểm tra thông tin thanh toán.",
        });
        setPaymentStatus(bookingResponse.data.booking.paymentStatus);

        if (data.paymentMethod === "bank_transfer" && bookingResponse.data.paymentResult?.bankInfo) {
          setBankInfo(bookingResponse.data.paymentResult.bankInfo);
        }

        if (data.paymentMethod !== "bank_transfer") {
          const bookingCheck = await axios.get(`/api/bookings/${bookingResponse.data.booking._id}`);
          if (bookingCheck.data.status === "confirmed" && bookingCheck.data.paymentStatus === "paid") {
            setTimeout(() => {
              navigate(`/testimonial?roomId=${roomid}&showReviewForm=true&bookingId=${bookingResponse.data.booking._id}`);
            }, 5000);
          } else {
            setBookingStatus({
              type: "warning",
              message: "Đặt phòng đang chờ xác nhận. Bạn sẽ có thể gửi đánh giá sau khi thanh toán hoàn tất.",
            });
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Lỗi khi đặt phòng hoặc tạo hóa đơn thanh toán. Vui lòng thử lại.";
      setBookingStatus({
        type: "error",
        message: errorMessage,
      });
      console.error("Lỗi đặt phòng:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCheckPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/${bookingId}`);
      if (response.data.paymentStatus === "paid") {
        setPaymentStatus("paid");
        setBookingStatus({
          type: "success",
          message: "Thanh toán đã được xác nhận! Đang chuyển hướng đến trang đánh giá...",
        });
        setTimeout(() => {
          navigate(`/testimonial?roomId=${roomid}&showReviewForm=true`);
        }, 2000);
      } else {
        setBookingStatus({
          type: "info",
          message: "Thanh toán chưa được xác nhận. Vui lòng kiểm tra lại sau.",
        });
      }
    } catch (error) {
      setBookingStatus({
        type: "error",
        message: "Lỗi khi kiểm tra trạng thái thanh toán. Vui lòng thử lại.",
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
          <p>
            <strong>Thời gian còn lại:</strong> {Math.floor(timeRemaining / 60)} phút {timeRemaining % 60} giây
          </p>
        )}
        <p className="text-warning">
          Vui lòng chuyển khoản để hoàn tất thanh toán. Đặt phòng sẽ được xác nhận sau khi chúng tôi nhận được tiền.
        </p>
        {!paymentExpired && paymentStatus === "pending" && (
          <>
            <button
              className="btn btn-primary mt-3 me-2"
              onClick={handleSimulatePayment}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Giả lập thanh toán thành công"}
            </button>
            <button
              className="btn btn-secondary mt-3"
              onClick={handleCheckPaymentStatus}
              disabled={loading}
            >
              {loading ? "Đang kiểm tra..." : "Kiểm tra trạng thái thanh toán"}
            </button>
          </>
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
    setBookingDetails(null); // Reset bookingDetails sau khi hủy
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
                <div className={`alert ${bookingStatus.type === "success" ? "alert-success" : bookingStatus.type === "info" ? "alert-info" : "alert-danger"}`}>
                  {bookingStatus.message}
                  {bookingStatus.type === "info" && (
                    <div className="spinner-border spinner-border-sm ms-2" role="status">
                      <span className="visually-hidden">Đang xử lý...</span>
                    </div>
                  )}
                </div>
              )}
              {renderPaymentStatus()}
              {renderBankInfo()}
              <div className="booking-screen-wrapper">
                <form className="booking-screen" onSubmit={handleSubmit(onSubmit)}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="text"
                          className={`form-control ${errors.name ? "is-invalid" : ""}`}
                          {...register("name")}
                          placeholder="Họ và tên"
                        />
                        {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="email"
                          className={`form-control ${errors.email ? "is-invalid" : ""}`}
                          {...register("email")}
                          placeholder="Email của bạn"
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="tel"
                          className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                          {...register("phone")}
                          placeholder="Số điện thoại"
                        />
                        {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="date"
                          className={`form-control ${errors.checkin ? "is-invalid" : ""}`}
                          {...register("checkin")}
                          placeholder="Ngày nhận phòng"
                          min={new Date().toISOString().split("T")[0]}
                        />
                        {errors.checkin && <div className="invalid-feedback">{errors.checkin.message}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <input
                          type="date"
                          className={`form-control ${errors.checkout ? "is-invalid" : ""}`}
                          {...register("checkout")}
                          placeholder="Ngày trả phòng"
                        />
                        {errors.checkout && <div className="invalid-feedback">{errors.checkout.message}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <select
                          className={`form-control ${errors.adults ? "is-invalid" : ""}`}
                          {...register("adults")}
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
                        {errors.adults && <div className="invalid-feedback">{errors.adults.message}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <select
                          className={`form-control ${errors.children ? "is-invalid" : ""}`}
                          {...register("children")}
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
                        {errors.children && <div className="invalid-feedback">{errors.children.message}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <select
                          className={`form-control ${errors.roomType ? "is-invalid" : ""}`}
                          {...register("roomType")}
                        >
                          <option value="" disabled>
                            Chọn loại phòng
                          </option>
                          <option value={room.type}>{room.type}</option>
                        </select>
                        {errors.roomType && <div className="invalid-feedback">{errors.roomType.message}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="paymentMethod">Phương thức thanh toán</label>
                    <select
                      className={`form-control ${errors.paymentMethod ? "is-invalid" : ""}`}
                      {...register("paymentMethod")}
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="credit_card">Thẻ tín dụng</option>
                      <option value="bank_transfer">Tài khoản ngân hàng</option>
                      <option value="mobile_payment">MoMo</option>
                      <option value="vnpay">VNPay</option>
                    </select>
                    {errors.paymentMethod && <div className="invalid-feedback">{errors.paymentMethod.message}</div>}
                  </div>
                  <div className="form-group">
                    <textarea
                      className={`form-control ${errors.specialRequest ? "is-invalid" : ""}`}
                      {...register("specialRequest")}
                      placeholder="Yêu cầu đặc biệt"
                      rows="3"
                    />
                    {errors.specialRequest && <div className="invalid-feedback">{errors.specialRequest.message}</div>}
                  </div>
                  <button
                    type="submit"
                    className="btn btn-book-now"
                    disabled={loading || room.availabilityStatus !== "available"}
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
              {room.availabilityStatus !== "available" && (
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
        bookingDetails={bookingDetails} // Sử dụng bookingDetails thay vì bookingData
      />
    </div>
  );
}

export default Bookingscreen;