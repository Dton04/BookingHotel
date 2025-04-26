import React, { useState } from "react";
import axios from "axios";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage"; // Thêm AlertMessage
import "./../css/booking-form.css";

function BookingForm({ onBookingStatus }) {
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertStatus, setAlertStatus] = useState(null); // { type, message }
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertStatus(null);
    setRooms([]);
    setSearched(true);

    if (!checkin || !checkout) {
      const errorMessage = "Vui lòng chọn ngày nhận phòng và trả phòng";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
      return;
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (checkinDate >= checkoutDate) {
      const errorMessage = "Ngày nhận phòng phải trước ngày trả phòng";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("/api/rooms/available", {
        params: {
          checkin: checkinDate.toISOString(),
          checkout: checkoutDate.toISOString(),
        },
      });
      setRooms(response.data);
      if (response.data.length > 0) {
        const successMessage = "Tìm thấy phòng phù hợp! Vui lòng chọn phòng để đặt.";
        setAlertStatus({ type: "success", message: successMessage });
        onBookingStatus({ type: "success", message: successMessage });
      } else {
        const infoMessage = "Không tìm thấy phòng trống trong khoảng thời gian này. Vui lòng thử lại với ngày khác.";
        setAlertStatus({ type: "error", message: infoMessage });
        onBookingStatus({ type: "error", message: infoMessage });
      }
    } catch (err) {
      console.error("Error fetching available rooms:", err.response?.data, err.message);
      const errorMessage = err.response?.data?.message || "Lỗi khi kiểm tra phòng trống";
      setAlertStatus({ type: "error", message: errorMessage });
      onBookingStatus({ type: "error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const formatPriceVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 1000000);
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
              <option value="" disabled>
                Trẻ em
              </option>
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "KIỂM TRA"}
          </button>
        </form>

        <div className="room-results mt-4">
          {loading ? (
            <div className="loading-spinner">
              <Spinner animation="border" variant="primary" /> Đang tải danh sách phòng...
            </div>
          ) : (
            <div className="room-grid">
              {rooms.map((room, index) => (
                <div key={index} className="room-card">
                  <div className="room-image">
                    <img
                      src={room.imageurls?.[0] || "/images/default-room.jpg"}
                      alt={room.name}
                      onError={(e) => (e.target.src = "/images/default-room.jpg")}
                    />
                    <div className="room-price">{formatPriceVND(room.rentperday)}</div>
                  </div>
                  <div className="room-content">
                    <h3>{room.name}</h3>
                    <p className="room-type">{room.type}</p>
                    <p className="room-description">
                      {room.description?.substring(0, 100) || "Phòng nghỉ thoải mái với tiện nghi hiện đại."}...
                    </p>
                    <button
                      className="btn-book"
                      onClick={() =>
                        navigate(
                          `/book/${room._id}?checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children}`
                        )
                      }
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default BookingForm;