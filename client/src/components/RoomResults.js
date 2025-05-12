import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Spinner, Alert } from "react-bootstrap";
import "./../css/room-results.css";

function RoomResults() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertStatus, setAlertStatus] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const formatPriceVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 1000000);
  };

  useEffect(() => {
    const fetchRooms = async () => {
      const params = new URLSearchParams(location.search);
      const checkin = params.get("checkin");
      const checkout = params.get("checkout");
      const adults = params.get("adults");
      const children = params.get("children");

      if (!checkin || !checkout) {
        setAlertStatus({
          type: "error",
          message: "Vui lòng cung cấp ngày nhận phòng và trả phòng",
        });
        return;
      }

      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      if (checkinDate >= checkoutDate) {
        setAlertStatus({
          type: "error",
          message: "Ngày nhận phòng phải trước ngày trả phòng",
        });
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
        if (response.data.length === 0) {
          setAlertStatus({
            type: "error",
            message:
              "Không tìm thấy phòng trống trong khoảng thời gian này. Vui lòng thử lại với ngày khác.",
          });
        }
      } catch (err) {
        console.error("Error fetching available rooms:", err);
        setAlertStatus({
          type: "error",
          message: err.response?.data?.message || "Lỗi khi kiểm tra phòng trống",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [location.search]);

  const handleBookNow = (room) => {
    const params = new URLSearchParams(location.search);
    navigate(
      `/book/${room._id}?checkin=${params.get("checkin")}&checkout=${params.get(
        "checkout"
      )}&adults=${params.get("adults")}&children=${params.get("children")}`
    );
  };

  return (
    <section className="room-results-section">
      <div className="container mx-auto px-4 py-8">
        {alertStatus && (
          <Alert
            variant={alertStatus.type === "error" ? "danger" : "success"}
            onClose={() => setAlertStatus(null)}
            dismissible
          >
            {alertStatus.message}
          </Alert>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner animation="border" variant="primary" />
            <span className="ml-4">Đang tải danh sách phòng...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-2xl font-semibold text-gray-700">
              Không tìm thấy phòng trống
            </h3>
            <p className="text-gray-500 mt-2">
              Vui lòng thử lại với khoảng thời gian khác.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="room-card flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="room-image md:w-1/3">
                  <img
                    src={room.imageurls?.[0] || "/images/default-room.jpg"}
                    alt={room.name}
                    className="w-full h-48 md:h-full object-cover"
                    onError={(e) => (e.target.src = "/images/default-room.jpg")}
                  />
                </div>
                <div className="room-content p-6 flex flex-col justify-between md:w-2/3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{room.type}</p>
                    <p className="text-gray-600 mt-2">
                      {room.description?.substring(0, 150) ||
                        "Phòng nghỉ thoải mái với tiện nghi hiện đại."}
                      ...
                    </p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <span className="mr-4">Sức chứa: {room.maxcount} người</span>
                      <span className="mr-4">Giường: {room.beds}</span>
                      <span>Phòng tắm: {room.baths}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatPriceVND(room.rentperday)} / đêm
                      </p>
                    </div>
                    <button
                      className="btn-book bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                      onClick={() => handleBookNow(room)}
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default RoomResults;