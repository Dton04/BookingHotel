import React, { useState } from "react";
import axios from "axios";
import { Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./../css/booking-form.css";

function BookingForm() {
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRooms([]);
    setSearched(true);

    if (!checkin || !checkout) {
      setError("Vui lòng chọn ngày nhận phòng và trả phòng");
      return;
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (checkinDate >= checkoutDate) {
      setError("Ngày nhận phòng phải trước ngày trả phòng");
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
    } catch (err) {
      console.error("Error fetching available rooms:", err.response?.data, err.message);
      setError(err.response?.data?.message || "Lỗi khi kiểm tra phòng trống");
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

  return (
    <section className="booking-form-section">
      <div className="booking-form-container">
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

        {error && (
          <Alert variant="danger" className="mt-3 alert-centered" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <div className="room-results mt-4">
          {loading ? (
            <div className="loading-spinner">
              <Spinner animation="border" variant="primary" /> Đang tải danh sách phòng...
            </div>
          ) : searched && rooms.length === 0 ? (
            <Alert variant="info" className="alert-centered">
              Không tìm thấy phòng trống trong khoảng thời gian này. Vui lòng thử lại với ngày khác.
            </Alert>
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