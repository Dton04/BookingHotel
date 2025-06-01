import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Spinner,
  Button,
  Badge,
  Card,
  Col,
  Row,
  Carousel,
  OverlayTrigger,
  Tooltip,
  Modal,
  Form,
  Pagination,
} from "react-bootstrap";
import { FaWifi, FaBed, FaBath, FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { toast } from 'react-toastify';
import AlertMessage from "../components/AlertMessage";
import "../css/room-results.css";

const RoomResults = () => {
  const [hotels, setHotels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertStatus, setAlertStatus] = useState(null);
  const [bookingLoading, setBookingLoading] = useState({});  const [filters, setFilters] = useState({
    priceRange: [0, Infinity],
    rating: 0,
    region: "",
  });
  const [sortBy, setSortBy] = useState("priceLowToHigh");
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Trạng thái phân trang
  const [hotelsPerPage] = useState(6); // Số khách sạn mỗi trang
  const location = useLocation();
  const navigate = useNavigate();  // Lấy danh sách phòng yêu thích
  const fetchFavorites = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo) return;

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/favorites', config);
      setFavoriteRooms(data.map(room => room._id));
    } catch (error) {
      console.error('Lỗi khi lấy danh sách yêu thích:', error);
    }
  };

  // Thêm/xóa khỏi yêu thích
  const toggleFavorite = async (roomId) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) {
      setAlertStatus({
        type: "warning",
        message: "Vui lòng đăng nhập để thêm phòng vào danh sách yêu thích"
      });
      return;
    }

    setFavoriteLoading(prev => ({ ...prev, [roomId]: true }));
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      if (favoriteRooms.includes(roomId)) {
        // Xóa khỏi yêu thích
        await axios.delete(`/api/favorites/${roomId}`, config);
        setFavoriteRooms(prev => prev.filter(id => id !== roomId));
        toast.success('Đã xóa phòng khỏi danh sách yêu thích');
      } else {
        // Thêm vào yêu thích
        await axios.post('/api/favorites', { roomId }, config);
        setFavoriteRooms(prev => [...prev, roomId]);
        toast.success('Đã thêm phòng vào danh sách yêu thích');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Đã có lỗi xảy ra';
      toast.error(message);
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [roomId]: false }));
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Lấy tham số từ query string
  const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      checkin: params.get("checkin"),
      checkout: params.get("checkout"),
      adults: params.get("adults"),
      children: params.get("children"),
      roomType: params.get("roomType"),
    };
  };

  // Gọi API để lấy danh sách khu vực
  const fetchRegions = async () => {
    try {
      const response = await axios.get("/api/regions");
      setRegions(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khu vực:", error.message);
      setAlertStatus({
        type: "error",
        message: "Lỗi khi lấy danh sách khu vực. Vui lòng thử lại.",
      });
    }
  };

  // Gọi API để lấy danh sách khách sạn và phòng
  const fetchAvailableHotels = async () => {
    const { checkin, checkout, adults, children, roomType } = getQueryParams();
    if (!checkin || !checkout || !adults) {
      setAlertStatus({
        type: "error",
        message: "Vui lòng cung cấp ngày nhận phòng, trả phòng và số lượng người lớn",
      });
      return;
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const totalGuests = Number(adults) + Number(children || 0);

    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      setAlertStatus({ type: "error", message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
      return;
    }
    if (checkinDate >= checkoutDate) {
      setAlertStatus({ type: "error", message: "Ngày nhận phòng phải trước ngày trả phòng" });
      return;
    }
    if (totalGuests < 1) {
      setAlertStatus({ type: "error", message: "Số lượng khách phải lớn hơn 0" });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get("/api/hotels", {
        params: { checkin, checkout, adults, children, roomType },
      });

      const filteredHotels = response.data.filter(
        (hotel) => hotel.rooms && hotel.rooms.length > 0
      );

      setHotels(filteredHotels);
      if (filteredHotels.length === 0) {
        let message = "Không có phòng phù hợp với yêu cầu của bạn.";
        if (roomType) {
          message = `Không có phòng loại "${roomType}" trong khoảng thời gian này.`;
        } else if (totalGuests > 4) {
          message = `Không có phòng phù hợp cho ${totalGuests} khách. Vui lòng thử số lượng khách ít hơn.`;
        }
        setAlertStatus({ type: "warning", message });
      } else {
        setAlertStatus(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Lỗi khi lấy danh sách phòng. Vui lòng thử lại.";
      setAlertStatus({ type: "error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions(); // Gọi API lấy danh sách khu vực
    fetchAvailableHotels();
  }, [location.search]);

  // Đóng alert
  const handleCloseAlert = () => {
    setAlertStatus(null);
  };

  // Xử lý đặt phòng
  const handleBooking = async (roomId) => {
    const { checkin, checkout, adults, children } = getQueryParams();
    if (!checkin || !checkout || !adults) {
      setAlertStatus({
        type: "error",
        message: "Vui lòng cung cấp ngày nhận phòng, trả phòng và số lượng người lớn",
      });
      return;
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      setAlertStatus({ type: "error", message: "Ngày nhận phòng hoặc trả phòng không hợp lệ" });
      return;
    }
    if (checkinDate >= checkoutDate) {
      setAlertStatus({ type: "error", message: "Ngày nhận phòng phải trước ngày trả phòng" });
      return;
    }

    setBookingLoading((prev) => ({ ...prev, [roomId]: true }));
    try {
      const room = hotels.flatMap((hotel) => hotel.rooms).find((r) => r._id === roomId);
      if (!room) {
        throw new Error("Không tìm thấy phòng");
      }

      await axios.post("/api/bookings/validate", {
        roomid: roomId,
        checkin,
        checkout,
        adults: Number(adults),
        children: Number(children || 0),
        roomType: room.type,
      });

      navigate(`/book/${roomId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Lỗi khi kiểm tra dữ liệu đặt phòng. Vui lòng thử lại.";
      setAlertStatus({ type: "error", message: errorMessage });
    } finally {
      setBookingLoading((prev) => ({ ...prev, [roomId]: false }));
    }
  };

  // Định dạng giá tiền
  const formatPriceVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 1000000);
  };

  // Xác định badge và tooltip dựa trên trạng thái phòng
  const getRoomStatus = (status) => {
    switch (status) {
      case "available":
        return {
          text: "Còn Phòng",
          bg: "success",
          tooltip: "Phòng sẵn sàng để đặt",
        };
      case "booked":
        return {
          text: "Hết Phòng",
          bg: "danger",
          tooltip: "Phòng đã được đặt trong khoảng thời gian này",
        };
      case "maintenance":
        return {
          text: "Đang Bảo Trì",
          bg: "warning",
          tooltip: "Phòng đang trong quá trình bảo trì",
        };
      case "busy":
        return {
          text: "Không Khả Dụng",
          bg: "secondary",
          tooltip: "Phòng hiện không khả dụng",
        };
      default:
        return {
          text: "Không Xác Định",
          bg: "secondary",
          tooltip: "Trạng thái phòng không xác định",
        };
    }
  };

  // Lọc và sắp xếp khách sạn
  const filteredAndSortedHotels = useMemo(() => {
    let result = [...hotels];

    // Lọc theo giá, đánh giá và khu vực
    result = result.filter((hotel) => {
      const matchesRegion = filters.region ? hotel.region._id === filters.region : true;
      return matchesRegion;
    }).map((hotel) => ({
      ...hotel,
      rooms: hotel.rooms.filter(
        (room) =>
          room.rentperday >= filters.priceRange[0] &&
          room.rentperday <= filters.priceRange[1] &&
          (hotel.rating || 0) >= filters.rating
      ),
    }));

    // Sắp xếp
    result.forEach((hotel) => {
      hotel.rooms.sort((a, b) => {
        if (sortBy === "priceLowToHigh") return a.rentperday - b.rentperday;
        if (sortBy === "priceHighToLow") return b.rentperday - a.rentperday;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
    });

    return result.filter((hotel) => hotel.rooms.length > 0);
  }, [hotels, filters, sortBy]);

  // Logic phân trang
  const indexOfLastHotel = currentPage * hotelsPerPage;
  const indexOfFirstHotel = indexOfLastHotel - hotelsPerPage;
  const currentHotels = filteredAndSortedHotels.slice(indexOfFirstHotel, indexOfLastHotel);
  const totalPages = Math.ceil(filteredAndSortedHotels.length / hotelsPerPage);

  // Xử lý hiển thị modal chi tiết phòng
  const handleShowRoomDetails = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  // Xử lý chuyển trang
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Cuộn lên đầu trang
  };

  return (
    <section className="room-results-section py-5">
      <div className="container">
        <AlertMessage
          type={alertStatus?.type}
          message={alertStatus?.message}
          onClose={handleCloseAlert}
        />
        <Row className="mb-4">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Khoảng giá</Form.Label>
              <Form.Control
                type="number"
                placeholder="Giá tối thiểu"
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [Number(e.target.value) || 0, prev.priceRange[1]],
                  }))
                }
              />
              <Form.Control
                type="number"
                placeholder="Giá tối đa"
                className="mt-2"
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], Number(e.target.value) || Infinity],
                  }))
                }
              />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Đánh giá tối thiểu</Form.Label>
              <Form.Select
                onChange={(e) => setFilters((prev) => ({ ...prev, rating: Number(e.target.value) }))}
              >
                <option value="0">Tất cả</option>
                <option value="3">3 sao trở lên</option>
                <option value="4">4 sao trở lên</option>
                <option value="5">5 sao</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>Khu Vực</Form.Label>
              <Form.Select
                onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))}
                value={filters.region}
              >
                <option value="">Tất cả khu vực</option>
                {regions.map((region) => (
                  <option key={region._id} value={region._id}>
                    {region.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={9}>
            <Form.Group className="mb-3">
              <Form.Label>Sắp xếp theo</Form.Label>
              <Form.Select onChange={(e) => setSortBy(e.target.value)}>
                <option value="priceLowToHigh">Giá: Thấp đến Cao</option>
                <option value="priceHighToLow">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </Form.Select>
            </Form.Group>
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Đang tìm kiếm phòng...</p>
              </div>
            ) : (
              <div className="results">
                <h2 className="mb-5 text-center fw-bold">Danh Sách Phòng Khách Sạn</h2>
                {currentHotels.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted mb-4 fs-5">
                      {alertStatus?.message || "Không có phòng phù hợp với yêu cầu của bạn."}
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      className="px-5"
                      onClick={() => navigate("/search")}
                    >
                      Tìm Kiếm Lại
                    </Button>
                  </div>
                ) : (
                  <>
                    {currentHotels.map((hotel) => (
                      <div key={hotel._id} className="hotel-item mb-5">
                        <h3 className="hotel-name mb-4">
                          {hotel.name}{" "}
                          {hotel.rating && (
                            <span className="ms-2">
                              {[...Array(Math.floor(hotel.rating))].map((_, i) => (
                                <FaStar key={i} className="text-warning" />
                              ))}
                              <small className="ms-2">({hotel.reviews || 0} đánh giá)</small>
                            </span>
                          )}
                        </h3>
                        <div className="hotel-images mb-4">
                          <Carousel
                            indicators={true}
                            controls={hotel.imageurls?.length > 1}
                            className="hotel-carousel"
                            interval={4000}
                          >
                            {(hotel.imageurls?.length > 0
                              ? hotel.imageurls
                              : ["/images/default-hotel.jpg"]
                            ).map((img, index) => (
                              <Carousel.Item key={index}>
                                <img
                                  className="d-block w-100"
                                  src={img}
                                  alt={`${hotel.name} - ${index + 1}`}
                                  onError={(e) => {
                                    e.target.src = "/images/default-hotel.jpg";
                                  }}
                                  style={{ height: "300px", objectFit: "cover" }}
                                />
                              </Carousel.Item>
                            ))}
                          </Carousel>
                        </div>
                        <div className="hotel-info mb-4">
                          <p><strong>Địa chỉ:</strong> {hotel.address}</p>
                          <p><strong>Email:</strong> {hotel.email}</p>
                          <p><strong>Số điện thoại:</strong> {hotel.contactNumber}</p>
                          <p><strong>Mô tả:</strong> {hotel.description || "Không có mô tả."}</p>
                          {hotel.deal && (
                            <p className="text-success">
                              <strong>Ưu đãi:</strong> {hotel.deal}
                            </p>
                          )}
                        </div>
                        <h4 className="mb-4">Phòng:</h4>
                        {hotel.rooms.length === 0 ? (
                          <p className="text-muted">Không có phòng tại khách sạn này.</p>
                        ) : (
                          <Row>
                            {hotel.rooms.map((room) => {
                              const { text, bg, tooltip } = getRoomStatus(room.status);
                              const isAvailable = room.status === "available";

                              return (
                                <Col md={4} key={room._id} className="mb-4">
                                  <Card className="room-card h-100">
                                    <div className="room-image-wrapper">
                                      <div className="room-image-container">
                                        <Carousel
                                          indicators={true}
                                          controls={room.imageurls?.length > 1}
                                          className="room-carousel"
                                          interval={4000}
                                        >
                                          {(room.imageurls?.length > 0
                                            ? room.imageurls
                                            : ["/images/default-room.jpg"]
                                          ).map((img, index) => (
                                            <Carousel.Item key={index}>
                                              <img
                                                className="d-block w-100"
                                                src={img}
                                                alt={`${room.name} - ${index + 1}`}
                                                onError={(e) => {
                                                  e.target.src = "/images/default-room.jpg";
                                                }}
                                              />
                                            </Carousel.Item>
                                          ))}
                                        </Carousel>
                                      </div>
                                      <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip>{tooltip}</Tooltip>}
                                      >
                                        <Badge bg={bg} className="room-status-badge">
                                          {text}
                                        </Badge>
                                      </OverlayTrigger>
                                    </div>
                                    <Card.Body className="d-flex flex-column">
                                      <Card.Title className="room-title">{room.name}</Card.Title>
                                      <Card.Text className="flex-grow-1">
                                        <div className="mb-2">
                                          <strong>Loại:</strong> {room.type}
                                        </div>
                                        <div className="mb-2 price-highlight">
                                          <strong>Giá:</strong> {formatPriceVND(room.rentperday)}/đêm
                                        </div>
                                        <div className="mb-2">
                                          <strong>Sức chứa:</strong>{" "}
                                          <FaBed className="me-1" /> {room.maxcount} người,{" "}
                                          {room.beds} giường
                                        </div>
                                        <div className="mb-2">
                                          <strong>Tiện nghi:</strong>{" "}
                                          <FaBath className="me-1" /> {room.baths} phòng tắm,{" "}
                                          <FaWifi className="me-1" /> WiFi
                                        </div>
                                        <div className="room-description mt-3">
                                          {room.description?.slice(0, 80) || "Không có mô tả chi tiết."}
                                          ...
                                        </div>
                                        {room.deal && (
                                          <div className="text-success mt-2">
                                            <strong>Ưu đãi:</strong> {room.deal}
                                          </div>
                                        )}
                                      </Card.Text>                                      <div className="mt-3 d-flex gap-2">
                                        <Button
                                          variant="outline-primary"
                                          onClick={() => handleShowRoomDetails(room)}
                                        >
                                          Xem chi tiết
                                        </Button>
                                        <Button
                                          variant={favoriteRooms.includes(room._id) ? "danger" : "outline-danger"}
                                          onClick={() => toggleFavorite(room._id)}
                                          disabled={favoriteLoading[room._id]}
                                        >
                                          {favoriteLoading[room._id] ? (
                                            <Spinner as="span" animation="border" size="sm" />
                                          ) : favoriteRooms.includes(room._id) ? (
                                            <><FaHeart /> Đã thích</>
                                          ) : (
                                            <><FaRegHeart /> Yêu thích</>
                                          )}
                                        </Button>
                                        <Button
                                          variant="primary"
                                          className="book-now-btn"
                                          onClick={() => handleBooking(room._id)}
                                          disabled={bookingLoading[room._id] || !isAvailable}
                                          style={{ opacity: isAvailable ? 1 : 0.6 }}
                                        >
                                          {bookingLoading[room._id] ? (
                                            <>
                                              <Spinner as="span" animation="border" size="sm" className="me-2" />
                                              Đang xử lý...
                                            </>
                                          ) : isAvailable ? (
                                            "Đặt Phòng Ngay"
                                          ) : (
                                            "Không Thể Đặt"
                                          )}
                                        </Button>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </Col>
                              );
                            })}
                          </Row>
                        )}
                      </div>
                    ))}
                    {/* Phân trang */}
                    <Pagination className="justify-content-center mt-4">
                      <Pagination.Prev
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      />
                      {[...Array(totalPages)].map((_, index) => (
                        <Pagination.Item
                          key={index + 1}
                          active={index + 1 === currentPage}
                          onClick={() => handlePageChange(index + 1)}
                        >
                          {index + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </>
                )}
              </div>
            )}
          </Col>
        </Row>

        {/* Modal chi tiết phòng */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{selectedRoom?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedRoom && (
              <>
                <Carousel>
                  {(selectedRoom.imageurls?.length > 0
                    ? selectedRoom.imageurls
                    : ["/images/default-room.jpg"]
                  ).map((img, index) => (
                    <Carousel.Item key={index}>
                      <img
                        className="d-block w-100"
                        src={img}
                        alt={`${selectedRoom.name} - ${index + 1}`}
                        onError={(e) => {
                          e.target.src = "/images/default-room.jpg";
                        }}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
                <div className="mt-3">
                  <h5>Thông tin chi tiết</h5>
                  <p><strong>Loại phòng:</strong> {selectedRoom.type}</p>
                  <p><strong>Giá:</strong> {formatPriceVND(selectedRoom.rentperday)}/đêm</p>
                  <p><strong>Sức chứa:</strong> {selectedRoom.maxcount} người, {selectedRoom.beds} giường</p>
                  <p><strong>Tiện nghi:</strong> {selectedRoom.baths} phòng tắm, WiFi</p>
                  <p><strong>Mô tả:</strong> {selectedRoom.description || "Không có mô tả chi tiết."}</p>
                  {selectedRoom.deal && (
                    <p className="text-success"><strong>Ưu đãi:</strong> {selectedRoom.deal}</p>
                  )}
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Đóng
            </Button>
            <Button
              variant="primary"
              onClick={() => handleBooking(selectedRoom._id)}
              disabled={bookingLoading[selectedRoom?._id] || selectedRoom?.status !== "available"}
            >
              {bookingLoading[selectedRoom?._id] ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Đang xử lý...
                </>
              ) : (
                "Đặt Phòng Ngay"
              )}
            </Button>               <Button
                        variant={favoriteRooms.includes(selectedRoom?._id) ? "danger" : "outline-danger"}
                        onClick={() => toggleFavorite(selectedRoom?._id)}
                        disabled={favoriteLoading[selectedRoom?._id]}
                      >
                        {favoriteLoading[selectedRoom?._id] ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : favoriteRooms.includes(selectedRoom?._id) ? (
                          <><FaHeart /> Đã thích</>
                        ) : (
                          <><FaRegHeart /> Yêu thích</>
                        )}
                      </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </section>
  );
};

export default RoomResults;