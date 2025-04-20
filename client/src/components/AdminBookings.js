import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./../css/admin-bookings.css"; // CSS tùy chỉnh

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy userInfo từ localStorage
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo || !userInfo.token) {
          throw new Error("Bạn cần đăng nhập để xem danh sách đặt phòng");
        }

        // Gọi API /api/bookings với token
        const response = await axios.get("/api/bookings", {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        setBookings(response.data);
      } catch (err) {
        console.error("Error fetching bookings:", err.response?.data, err.message);
        setError(err.response?.data?.message || err.message);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("userInfo"); // Xóa userInfo nếu token không hợp lệ
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  const handleConfirm = async (bookingId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        throw new Error("Bạn cần đăng nhập để thực hiện hành động này");
      }

      await axios.put(`/api/bookings/${bookingId}/confirm`, {}, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      setBookings(bookings.map((booking) =>
        booking._id === bookingId ? { ...booking, status: "confirmed" } : booking
      ));
    } catch (err) {
      console.error("Error confirming booking:", err.response?.data, err.message);
      setError(err.response?.data?.message || "Lỗi khi xác nhận đặt phòng");
    }
  };

  const handleCancel = async (bookingId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || !userInfo.token) {
        throw new Error("Bạn cần đăng nhập để thực hiện hành động này");
      }

      await axios.put(`/api/bookings/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      setBookings(bookings.map((booking) =>
        booking._id === bookingId ? { ...booking, status: "canceled" } : booking
      ));
    } catch (err) {
      console.error("Error canceling booking:", err.response?.data, err.message);
      setError(err.response?.data?.message || "Lỗi khi hủy đặt phòng");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Chờ xác nhận</Badge>;
      case "confirmed":
        return <Badge bg="success">Đã xác nhận</Badge>;
      case "canceled":
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  return (
    <section className="admin-bookings">
      <div className="container">
        <h2 className="title">Quản lý đặt phòng</h2>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {loading ? (
          <div className="loading-spinner">
            <Spinner animation="border" variant="primary" /> Đang tải danh sách đặt phòng...
          </div>
        ) : bookings.length === 0 ? (
          <Alert variant="info">Không có đặt phòng nào trong hệ thống.</Alert>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Phòng</th>
                <th>Khách hàng</th>
                <th>Ngày nhận phòng</th>
                <th>Ngày trả phòng</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{booking._id}</td>
                  <td>{booking.roomid?.name || "Phòng không xác định"}</td>
                  <td>
                    {booking.name} <br />
                    <small>{booking.email}</small>
                  </td>
                  <td>{new Date(booking.checkin).toLocaleDateString("vi-VN")}</td>
                  <td>{new Date(booking.checkout).toLocaleDateString("vi-VN")}</td>
                  <td>{getStatusBadge(booking.status)}</td>
                  <td>
                    {booking.status === "pending" && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleConfirm(booking._id)}
                          className="me-2"
                        >
                          Xác nhận
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(booking._id)}
                        >
                          Hủy
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </section>
  );
}

export default AdminBookings;