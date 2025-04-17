import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../css/historybooking.css";

function HistoryBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  // Lấy email người dùng từ localStorage
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const userEmail = userInfo?.email;

  // Hàm lấy danh sách đặt phòng
  const fetchBookings = async () => {
    if (!userEmail) {
      setError("Bạn cần đăng nhập để xem lịch sử đặt phòng.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/bookings?email=${userEmail}`);
      const userBookings = response.data.filter(
        (booking) => booking.email === userEmail
      );
      setBookings(userBookings);
      setFilteredBookings(userBookings);
    } catch (err) {
      setError("Lỗi khi tải lịch sử đặt phòng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách đặt phòng khi component mount
  useEffect(() => {
    fetchBookings();
  }, [userEmail]);

  // Xử lý lọc theo trạng thái
  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(
        (booking) => booking.status === filterStatus
      );
      setFilteredBookings(filtered);
    }
  }, [filterStatus, bookings]);

  // Xử lý hủy đặt phòng
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đặt phòng này?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.put(`/api/bookings/${bookingId}/cancel`);
      const updatedBookings = bookings.map((booking) =>
        booking._id === bookingId ? { ...booking, status: "canceled" } : booking
      );
      setBookings(updatedBookings);
      setFilteredBookings(
        filterStatus === "all"
          ? updatedBookings
          : updatedBookings.filter((booking) => booking.status === filterStatus)
      );
    } catch (err) {
      setError("Lỗi khi hủy đặt phòng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="container mt-5">
        <h2 className="text-center mb-4">Lịch sử đặt phòng</h2>
        <div className="alert alert-warning text-center">
          Bạn cần <Link to="/login">đăng nhập</Link> để xem lịch sử đặt phòng.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <h2 className="text-center mb-4">Lịch sử đặt phòng</h2>
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <h2 className="text-center mb-4">Lịch sử đặt phòng</h2>
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="container bookings-page mt-5">
      <h2 className="text-center mb-4">Lịch sử đặt phòng</h2>

      {/* Bộ lọc trạng thái và nút làm mới */}
      <div className="filter-section mb-4 d-flex justify-content-between align-items-center">
        <div>
          <label htmlFor="statusFilter" className="me-2">Lọc theo trạng thái:</label>
          <select
            id="statusFilter"
            className="form-control d-inline-block w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="canceled">Đã hủy</option>
          </select>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchBookings}
          disabled={loading}
        >
          Làm mới
        </button>
      </div>

      {/* Bảng lịch sử đặt phòng */}
      {filteredBookings.length === 0 ? (
        <div className="alert alert-info text-center">
          {filterStatus === "all"
            ? "Bạn chưa có đặt phòng nào."
            : `Không có đặt phòng nào với trạng thái "${
                filterStatus === "pending"
                  ? "Chờ xác nhận"
                  : filterStatus === "confirmed"
                  ? "Đã xác nhận"
                  : "Đã hủy"
              }".`}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Tên phòng</th>
                <th>Ngày nhận phòng</th>
                <th>Ngày trả phòng</th>
                <th>Số người lớn</th>
                <th>Số trẻ em</th>
                <th>Loại phòng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{booking.roomid?.name || "Không xác định"}</td>
                  <td>{new Date(booking.checkin).toLocaleDateString()}</td>
                  <td>{new Date(booking.checkout).toLocaleDateString()}</td>
                  <td>{booking.adults}</td>
                  <td>{booking.children}</td>
                  <td>{booking.roomType || "Không xác định"}</td>
                  <td>
                    <span
                      className={`badge ${
                        booking.status === "confirmed"
                          ? "bg-success"
                          : booking.status === "pending"
                          ? "bg-warning"
                          : "bg-danger"
                      }`}
                    >
                      {booking.status === "pending"
                        ? "Chờ xác nhận"
                        : booking.status === "confirmed"
                        ? "Đã xác nhận"
                        : "Đã hủy"}
                    </span>
                  </td>
                  <td>
                    {booking.status === "pending" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={loading}
                      >
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HistoryBookings;