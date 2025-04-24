import React, { useState, useEffect } from "react";
import axios from "axios";
import Room from "./Room";
import { Pagination } from "react-bootstrap";
import "./../css/rooms-content.css";

function RoomsContent() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 6;

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

  // Tính toán phân trang
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = rooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(rooms.length / roomsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationItems = () => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return items;
  };

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
          ) : currentRooms.length > 0 ? (
            currentRooms.map((room, index) => (
              <Room key={index} room={room} />
            ))
          ) : (
            <div className="no-rooms">
              <p>Không tìm thấy phòng nào.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-container">
            <Pagination>
              <Pagination.Prev
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              />
              {renderPaginationItems()}
              <Pagination.Next
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </div>
    </section>
  );
}

export default RoomsContent;