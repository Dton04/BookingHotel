import React, { useState, useEffect } from "react";
import axios from "axios";
import Room from "./Room";
import './../css/rooms-content.css';

function RoomsContent() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await axios.get("/api/rooms/getallrooms");
        setRooms(response.data);
      } catch (error) {
        setError(true);
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section className="rooms-content">
      <div className="container">
        <div className="rooms-header">
          <h2 className="subtitle">KHÁM PHÁ PHÒNG NGHỈ</h2>
          <h1 className="title">
            Phòng nghỉ <span>đẳng cấp</span> của chúng tôi
          </h1>
          <p className="description">
            Trải nghiệm không gian nghỉ dưỡng sang trọng với đầy đủ tiện nghi hiện đại
          </p>
        </div>

        <div className="room-grid">
          {loading ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i> Đang tải danh sách phòng...
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i> Đã có lỗi xảy ra khi tải dữ liệu
            </div>
          ) : (
            rooms.map((room, index) => (
              <Room key={index} room={room} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default RoomsContent;