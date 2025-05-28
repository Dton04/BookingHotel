import React, { useState, useEffect } from "react";
import axios from "axios";
import Room from "./Room";
import { Pagination } from "react-bootstrap";
import "./../css/rooms-content.css";

function RoomsContent() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [averageRatings, setAverageRatings] = useState({}); // Lưu điểm trung bình của từng khách sạn
  const hotelsPerPage = 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await axios.get("/api/hotels");
        const hotelsData = response.data;
        setHotels(hotelsData);

        // Lấy điểm trung bình cho từng khách sạn
        const ratings = {};
        await Promise.all(
          hotelsData.map(async (hotel) => {
            try {
              const ratingResponse = await axios.get("/api/reviews/average", {
                params: { hotelId: hotel._id },
              });
              ratings[hotel._id] = ratingResponse.data;
            } catch (error) {
              ratings[hotel._id] = { average: 0, totalReviews: 0 };
            }
          })
        );
        setAverageRatings(ratings);
      } catch (error) {
        setError(true);
        console.error("Lỗi khi lấy danh sách khách sạn:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const indexOfLastHotel = currentPage * hotelsPerPage;
  const indexOfFirstHotel = indexOfLastHotel - hotelsPerPage;
  const currentHotels = hotels.slice(indexOfFirstHotel, indexOfLastHotel);
  const totalPages = Math.ceil(hotels.length / hotelsPerPage);

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
          className="pagination-item"
        >
          {number}
        </Pagination.Item>
      );
    }
    return items;
  };

  return (
    <section className="rooms-content py-5 bg-light">
      <div className="container">
        <div className="rooms-header text-center mb-5">
          <h2 className="subtitle text-uppercase mb-2">Khám Phá Khách Sạn</h2>
          <h1 className="title mb-3">
            Khách sạn <span className="text-primary">đẳng cấp</span> của chúng tôi
          </h1>
          <p className="description text-muted">
            Trải nghiệm không gian nghỉ dưỡng sang trọng với đầy đủ tiện nghi hiện đại
          </p>
        </div>

        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
            <p className="mt-2">Đang tải danh sách khách sạn...</p>
          </div>
        ) : error ? (
          <div className="error-message text-center text-danger">
            <i className="fas fa-exclamation-triangle fa-2x"></i>
            <p className="mt-2">Đã có lỗi xảy ra khi tải dữ liệu</p>
          </div>
        ) : currentHotels.length > 0 ? (
          currentHotels.map((hotel) => (
            <div key={hotel._id} className="hotel-section mb-5">
              <div className="hotel-card card shadow-sm">
                {hotel.imageurls?.[0] && (
                  <div className="hotel-image-container" style={{ height: '300px' }}>
                    <img
                      src={hotel.imageurls[0]}
                      alt={hotel.name}
                      className="hotel-image img-fluid"
                      onError={(e) => (e.target.src = "/images/default-hotel.jpg")}
                    />
                  </div>
                )}
                <div className="card-body">
                  <h3 className="hotel-title">{hotel.name}</h3>
                  <p className="hotel-address text-muted">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    {hotel.address}
                  </p>
                  {averageRatings[hotel._id] && averageRatings[hotel._id].totalReviews > 0 && (
                    <p className="hotel-rating text-muted">
                      <i className="fas fa-star me-2"></i>
                      {averageRatings[hotel._id].average.toFixed(1)}/5
                    </p>
                  )}
                  <p className="hotel-description text-muted">
                    {hotel.description || "Không có mô tả chi tiết."}
                  </p>
                </div>
              </div>
              <div className="room-grid mt-4">
                {hotel.rooms.length > 0 ? (
                  hotel.rooms.map((room) => (
                    <Room key={room._id} room={{ ...room, hotelId: hotel._id }} />
                  ))
                ) : (
                  <p className="text-muted text-center">
                    Không có phòng nào trong khách sạn này.
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-hotels text-center">
            <p className="text-muted">Không tìm thấy khách sạn nào.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-container d-flex justify-content-center mt-5">
            <Pagination className="custom-pagination">
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