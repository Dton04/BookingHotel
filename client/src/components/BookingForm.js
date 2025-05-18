// BookingForm.js
import React, { useState } from "react";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import "./../css/booking-form.css";

function BookingForm({ onBookingStatus }) {
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [roomType, setRoomType] = useState(""); // Thêm trạng thái cho loại phòng
  const [loading, setLoading] = useState(false);
  const [alertStatus, setAlertStatus] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertStatus(null);

    // Kiểm tra các trường bắt buộc
    if (!checkin || !checkout) {
      const errorMessage = "Vui lòng chọn ngày nhận phòng và trả phòng";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
      return;
    }

    // Kiểm tra ngày hợp lệ
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      const errorMessage = "Ngày nhận phòng hoặc trả phòng không hợp lệ";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
      return;
    }

    if (checkinDate >= checkoutDate) {
      const errorMessage = "Ngày nhận phòng phải trước ngày trả phòng";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
      return;
    }

    // Kiểm tra số lượng khách
    if (!adults || adults < 1) {
      const errorMessage = "Vui lòng chọn số lượng người lớn";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
      return;
    }

    if (children < 0) {
      const errorMessage = "Số lượng trẻ em không hợp lệ";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
      return;
    }

    try {
      setLoading(true);
      // Chuyển hướng với các tham số tìm kiếm, bao gồm roomType
      navigate(
        `/room-results?checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(
          checkout
        )}&adults=${encodeURIComponent(adults)}&children=${encodeURIComponent(
          children
        )}${roomType ? `&roomType=${encodeURIComponent(roomType)}` : ""}`
      );
    } catch (err) {
      console.error("Lỗi khi chuyển hướng:", err);
      const errorMessage = "Lỗi khi xử lý yêu cầu";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlertStatus(null);
  };

  return (
    <section className="booking-form-section">
      <div className="booking-form-container">
        <AlertMessage
          type={alertStatus?.type}
          message={alertStatus?.message}
          onClose={handleCloseAlert}
        />
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>CHECK IN</label>
            <input
              type="date"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
              placeholder="dd/mm/yyyy"
            />
          </div>
          <div className="form-group">
            <label>CHECK OUT</label>
            <input
              type="date"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              min={
                checkin
                  ? new Date(new Date(checkin).setDate(new Date(checkin).getDate() + 1))
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              required
              placeholder="dd/mm/yyyy"
            />
          </div>
          <div className="form-group">
            <label>NGƯỜI LỚN</label>
            <select value={adults} onChange={(e) => setAdults(e.target.value)} required>
              <option value="" disabled>
                Người lớn
              </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div className="form-group">
            <label>TRẺ EM</label>
            <select value={children} onChange={(e) => setChildren(e.target.value)} required>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div className="form-group">
            <label>LOẠI PHÒNG</label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Luxury">Luxury</option>
              {/* Thêm các loại phòng khác nếu cần */}
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "KIỂM TRA"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default BookingForm;