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
  ListGroup,
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
  const [bookingLoading, setBookingLoading] = useState({});
  const [filters, setFilters] = useState({
    priceRange: [0, Infinity],
    rating: 0,
    region: "",
    amenities: [],
    roomTypes: [],
    bedTypes: [],
    cancellationPolicy: "",
    breakfast: false,
    freeCancellation: false,
    instantConfirmation: false,
    specialOffers: false,
    sortBy: "recommended",
    services: []
  });
  const [sortBy, setSortBy] = useState("priceLowToHigh");
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hotelsPerPage] = useState(4);
  const [averageRatings, setAverageRatings] = useState({});
  const [hotelServices, setHotelServices] = useState({});
  const [serviceCategories, setServiceCategories] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showRooms, setShowRooms] = useState(false);
  const [showServices, setShowServices] = useState(false);

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
        await axios.delete(`/api/favorites/${roomId}`, config);
        setFavoriteRooms(prev => prev.filter(id => id !== roomId));
        toast.success('Đã xóa phòng khỏi danh sách yêu thích');
      } else {
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

  const fetchAverageRatings = async () => {
    try {
      const ratings = {};
      await Promise.all(
        hotels.map(async (hotel) => {
          try {
            const response = await axios.get("/api/reviews/average", {
              params: { hotelId: hotel._id },
            });
            ratings[hotel._id] = response.data;
          } catch (error) {
            ratings[hotel._id] = { average: 0, totalReviews: 0 };
          }
        })
      );
      setAverageRatings(ratings);
    } catch (error) {
      console.error("Lỗi khi lấy điểm trung bình đánh giá:", error);
      setAlertStatus({
        type: "error",
        message: "Lỗi khi lấy điểm trung bình đánh giá. Vui lòng thử lại.",
      });
    }
  };

  const fetchServiceCategories = async () => {
    try {
      const response = await axios.get("/api/services/categories");
      setServiceCategories(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh mục dịch vụ:", error.message);
    }
  };

  const fetchHotelServices = async () => {
    try {
      const services = {};
      await Promise.all(
        hotels.map(async (hotel) => {
          try {
            const response = await axios.get(`/api/services/hotel/${hotel._id}`);
            services[hotel._id] = response.data;
          } catch (error) {
            services[hotel._id] = [];
          }
        })
      );
      setHotelServices(services);
    } catch (error) {
      console.error("Lỗi khi lấy dịch vụ khách sạn:", error);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

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

  const fetchAvailableHotels = async () => {
    const searchParams = new URLSearchParams(location.search);
    const { checkin, checkout, adults, children, roomType } = getQueryParams();
    const destination = searchParams.get("destination");
    
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
        params: { checkin, checkout, adults, children, roomType, destination },
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
    fetchRegions();
    fetchAvailableHotels();
  }, [location.search]);

  useEffect(() => {
    if (hotels.length > 0) {
      fetchAverageRatings();
      fetchHotelServices();
    }
  }, [hotels]);

  useEffect(() => {
    fetchServiceCategories();
  }, []);

  const handleCloseAlert = () => {
    setAlertStatus(null);
  };

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

  const formatPriceVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 1000000);
  };

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

  const filteredAndSortedHotels = useMemo(() => {
    let result = [...hotels];

    result = result.filter((hotel) => {
      const matchesRegion = filters.region ? hotel.region._id === filters.region : true;
      const matchesServices = filters.services.length === 0 || 
        filters.services.some(serviceCategory => 
          hotelServices[hotel._id]?.some(service => service.category === serviceCategory)
        );
      return matchesRegion && matchesServices;
    }).map((hotel) => ({
      ...hotel,
      rooms: hotel.rooms.filter(
        (room) =>
          room.rentperday >= filters.priceRange[0] &&
          room.rentperday <= filters.priceRange[1] &&
          (averageRatings[hotel._id]?.average || 0) >= filters.rating
      ),
    }));

    result.forEach((hotel) => {
      hotel.rooms.sort((a, b) => {
        if (sortBy === "priceLowToHigh") return a.rentperday - b.rentperday;
        if (sortBy === "priceHighToLow") return b.rentperday - a.rentperday;
        if (sortBy === "rating") return (averageRatings[hotel._id]?.average || 0) - (averageRatings[hotel._id]?.average || 0);
        return 0;
      });
    });

    return result.filter((hotel) => hotel.rooms.length > 0);
  }, [hotels, filters, sortBy, averageRatings, hotelServices]);

  const indexOfLastHotel = currentPage * hotelsPerPage;
  const indexOfFirstHotel = indexOfLastHotel - hotelsPerPage;
  const currentHotels = filteredAndSortedHotels.slice(indexOfFirstHotel, indexOfLastHotel);
  const totalPages = Math.ceil(filteredAndSortedHotels.length / hotelsPerPage);

  const handleShowRoomDetails = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            <Card className="filter-card shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Bộ lọc tìm kiếm</h5>
              </Card.Header>
              <Card.Body>
                <div className="filter-section mb-4">
                  <h6 className="filter-title">Khoảng giá</h6>
                  <div className="price-range-slider">
                    <Form.Range
                      min={0}
                      max={10000000}
                      step={100000}
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priceRange: [prev.priceRange[0], Number(e.target.value)],
                        }))
                      }
                    />
                    <div className="d-flex justify-content-between">
                      <span>{formatPriceVND(filters.priceRange[0])}</span>
                      <span>{formatPriceVND(filters.priceRange[1])}</span>
                    </div>
                  </div>
                </div>

                <div className="filter-section mb-4">
                  <h6 className="filter-title">Đánh giá</h6>
                  <div className="rating-filters">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Form.Check
                        key={rating}
                        type="radio"
                        id={`rating-${rating}`}
                        label={
                          <div className="d-flex align-items-center">
                            {[...Array(rating)].map((_, i) => (
                              <FaStar key={i} className="text-warning me-1" />
                            ))}
                            <span className="ms-2">trở lên</span>
                          </div>
                        }
                        checked={filters.rating === rating}
                        onChange={() => setFilters((prev) => ({ ...prev, rating }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="filter-section mb-4">
                  <h6 className="filter-title">Khu vực</h6>
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
                </div>

                <div className="filter-section mb-4">
                  <h6 className="filter-title">Loại phòng</h6>
                  <div className="room-type-filters">
                    {["Standard", "Deluxe", "Suite", "Executive", "Family"].map((type) => (
                      <Form.Check
                        key={type}
                        type="checkbox"
                        id={`room-type-${type}`}
                        label={type}
                        checked={filters.roomTypes.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...filters.roomTypes, type]
                            : filters.roomTypes.filter((t) => t !== type);
                          setFilters((prev) => ({ ...prev, roomTypes: newTypes }));
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="filter-section mb-4">
                  <h6 className="filter-title">Tiện nghi</h6>
                  <div className="amenities-filters">
                    {[
                      { icon: <FaWifi />, label: "WiFi miễn phí" },
                      { icon: <FaBed />, label: "Giường lớn" },
                      { icon: <FaBath />, label: "Bồn tắm" },
                      { icon: "🅿️", label: "Bãi đỗ xe" },
                      { icon: "🏊", label: "Hồ bơi" },
                      { icon: "🏋️", label: "Phòng gym" },
                    ].map((amenity) => (
                      <Form.Check
                        key={amenity.label}
                        type="checkbox"
                        id={`amenity-${amenity.label}`}
                        label={
                          <div className="d-flex align-items-center">
                            <span className="me-2">{amenity.icon}</span>
                            {amenity.label}
                          </div>
                        }
                        checked={filters.amenities.includes(amenity.label)}
                        onChange={(e) => {
                          const newAmenities = e.target.checked
                            ? [...filters.amenities, amenity.label]
                            : filters.amenities.filter((a) => a !== amenity.label);
                          setFilters((prev) => ({ ...prev, amenities: newAmenities }));
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="filter-section mb-4">
                  <h6 className="filter-title">Tính năng đặc biệt</h6>
                  <div className="special-features">
                    <Form.Check
                      type="checkbox"
                      id="breakfast"
                      label="Bao gồm bữa sáng"
                      checked={filters.breakfast}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, breakfast: e.target.checked }))
                      }
                    />
                    <Form.Check
                      type="checkbox"
                      id="freeCancellation"
                      label="Hủy miễn phí"
                      checked={filters.freeCancellation}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, freeCancellation: e.target.checked }))
                      }
                    />
                    <Form.Check
                      type="checkbox"
                      id="instantConfirmation"
                      label="Xác nhận ngay lập tức"
                      checked={filters.instantConfirmation}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, instantConfirmation: e.target.checked }))
                      }
                    />
                    <Form.Check
                      type="checkbox"
                      id="specialOffers"
                      label="Ưu đãi đặc biệt"
                      checked={filters.specialOffers}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, specialOffers: e.target.checked }))
                      }
                    />
                  </div>
                </div>

                <div className="filter-section mb-4">
                  <h6 className="filter-title">Dịch vụ khách sạn</h6>
                  <div className="service-filters">
                    {serviceCategories.map((category) => (
                      <Form.Check
                        key={category.value}
                        type="checkbox"
                        id={`service-${category.value}`}
                        label={
                          <div className="d-flex align-items-center">
                            <i className={`${category.icon} me-2`}></i>
                            {category.label}
                          </div>
                        }
                        checked={filters.services.includes(category.value)}
                        onChange={(e) => {
                          const newServices = e.target.checked
                            ? [...filters.services, category.value]
                            : filters.services.filter((s) => s !== category.value);
                          setFilters((prev) => ({ ...prev, services: newServices }));
                        }}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline-primary"
                  className="w-100"
                  onClick={() =>
                    setFilters({
                      priceRange: [0, Infinity],
                      rating: 0,
                      region: "",
                      amenities: [],
                      roomTypes: [],
                      bedTypes: [],
                      cancellationPolicy: "",
                      breakfast: false,
                      freeCancellation: false,
                      instantConfirmation: false,
                      specialOffers: false,
                      sortBy: "recommended",
                      services: []
                    })
                  }
                >
                  Đặt lại bộ lọc
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={9}>
            <div className="sort-bar mb-4">
              <Form.Select
                className="w-auto"
                onChange={(e) => setSortBy(e.target.value)}
                value={sortBy}
              >
                <option value="recommended">Đề xuất cho bạn</option>
                <option value="priceLowToHigh">Giá: Thấp đến Cao</option>
                <option value="priceHighToLow">Giá: Cao đến Thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="distance">Khoảng cách gần nhất</option>
              </Form.Select>
            </div>
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Đang tìm kiếm khách sạn...</p>
              </div>
            ) : (
              <div className="results">
                {currentHotels.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted mb-4 fs-5">
                      {alertStatus?.message || "Không có khách sạn phù hợp với yêu cầu của bạn."}
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
                      <Card 
                        key={hotel._id} 
                        className="hotel-card mb-4"
                        onClick={() => navigate(`/hotel/${hotel._id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Row className="g-0">
                          <Col md={4}>
                            <div className="hotel-image-container">
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
                                    />
                                  </Carousel.Item>
                                ))}
                              </Carousel>
                            </div>
                          </Col>
                          <Col md={8}>
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <Card.Title className="hotel-name mb-2">
                                    {hotel.name}
                                  </Card.Title>
                                  {averageRatings[hotel._id] && averageRatings[hotel._id].totalReviews > 0 && (
                                    <div className="hotel-rating mb-2">
                                      <FaStar className="text-warning me-1" />
                                      <span className="rating-value">{averageRatings[hotel._id].average.toFixed(1)}</span>
                                      <small className="ms-2 text-muted">
                                        ({averageRatings[hotel._id].totalReviews} đánh giá)
                                      </small>
                                    </div>
                                  )}
                                  <div className="hotel-location mb-2">
                                    <i className="fas fa-map-marker-alt me-2"></i>
                                    {hotel.address}
                                  </div>
                                </div>
                                <div className="hotel-actions">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => {
                                      setSelectedHotel(hotel);
                                      setShowRooms(true);
                                    }}
                                  >
                                    Xem phòng
                                  </Button>
                                  <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => {
                                      setSelectedHotel(hotel);
                                      setShowServices(true);
                                    }}
                                  >
                                    <i className="fas fa-concierge-bell me-1"></i>
                                    Dịch vụ
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedHotel(hotel);
                                      setShowRooms(true);
                                    }}
                                  >
                                    Đặt ngay
                                  </Button>
                                </div>
                              </div>
                              <div className="hotel-features mt-3">
                                <div className="feature-tags">
                                  {hotel.amenities?.slice(0, 4).map((amenity, index) => (
                                    <span key={index} className="feature-tag">
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="hotel-services mt-3">
                                <h6 className="services-title mb-2">
                                  <i className="fas fa-concierge-bell me-2"></i>
                                  Dịch vụ khách sạn
                                </h6>
                                <div className="service-tags">
                                  {hotelServices[hotel._id]?.slice(0, 6).map((service, index) => (
                                    <span key={index} className="service-tag">
                                      <i className={`${service.icon} me-1`}></i>
                                      {service.name}
                                      {!service.isFree && (
                                        <span className="service-price ms-1">
                                          ({formatPriceVND(service.price)})
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                  {hotelServices[hotel._id]?.length > 6 && (
                                    <span className="service-tag more-services">
                                      +{hotelServices[hotel._id].length - 6} dịch vụ khác
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="hotel-description mt-3">
                                <p className="mb-0">{hotel.description?.slice(0, 150)}...</p>
                              </div>
                            </Card.Body>
                          </Col>
                        </Row>
                      </Card>
                    ))}
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

        <Modal
          show={showRooms}
          onHide={() => setShowRooms(false)}
          size="xl"
          className="rooms-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedHotel?.name} - Danh sách phòng
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedHotel && (
              <div className="rooms-container">
                <Row className="g-4">
                  {selectedHotel.rooms.map((room) => {
                    const { text, bg, tooltip } = getRoomStatus(room.status);
                    const isAvailable = room.status === "available";
                    return (
                      <Col md={6} key={room._id}>
                        <div className="room-modal-card">
                          <div className="room-modal-img-wrap">
                            <Carousel
                              indicators={room.imageurls?.length > 1}
                              controls={room.imageurls?.length > 1}
                              className="room-modal-carousel"
                              interval={4000}
                            >
                              {(room.imageurls?.length > 0 ? room.imageurls : ["/images/default-room.jpg"]).map((img, idx) => (
                                <Carousel.Item key={idx}>
                                  <img
                                    className="room-modal-img"
                                    src={img}
                                    alt={`${room.name} - ${idx + 1}`}
                                    onError={e => { e.target.src = "/images/default-room.jpg"; }}
                                  />
                                </Carousel.Item>
                              ))}
                            </Carousel>
                            <Badge bg={bg} className="room-modal-badge">
                              {text}
                            </Badge>
                          </div>
                          <div className="room-modal-info">
                            <div className="d-flex align-items-center mb-2">
                              <span className="room-modal-type me-2"><i className="fa fa-bed me-1"></i>{room.type?.toUpperCase()}</span>
                              <span className="room-modal-capacity ms-auto"><i className="fa fa-user-friends me-1"></i>{room.maxcount} người</span>
                            </div>
                            <div className="d-flex align-items-center mb-2">
                              <span className="me-3"><i className="fa fa-bed me-1"></i>{room.beds} giường</span>
                              <span className="me-3"><i className="fa fa-bath me-1"></i>{room.baths} phòng tắm</span>
                              <span><i className="fa fa-wifi me-1"></i>WiFi miễn phí</span>
                            </div>
                            <div className="room-modal-desc mb-2">
                              {room.description?.slice(0, 60) || "Không có mô tả chi tiết."}...
                            </div>
                            <div className="d-flex align-items-end justify-content-between mt-3">
                              <div className="room-modal-price">
                                {formatPriceVND(room.rentperday)} <span className="room-modal-price-unit">/đêm</span>
                              </div>
                              <div className="room-modal-actions">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleShowRoomDetails(room)}
                                >
                                  Chi tiết
                                </Button>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleBooking(room._id)}
                                  disabled={bookingLoading[room._id] || !isAvailable}
                                >
                                  {bookingLoading[room._id] ? (
                                    <>
                                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                                      Đang xử lý...
                                    </>
                                  ) : isAvailable ? (
                                    "Đặt ngay"
                                  ) : (
                                    "Hết phòng"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            )}
          </Modal.Body>
        </Modal>

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
            </Button>
            <Button
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

        <Modal
          show={showServices}
          onHide={() => setShowServices(false)}
          size="lg"
          className="services-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="fas fa-concierge-bell me-2"></i>
              Dịch vụ - {selectedHotel?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedHotel && hotelServices[selectedHotel._id] ? (
              <div className="services-container">
                {hotelServices[selectedHotel._id].length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-concierge-bell fa-3x text-muted mb-3"></i>
                    <p className="text-muted">Khách sạn này chưa có dịch vụ nào</p>
                  </div>
                ) : (
                  <Row className="g-4">
                    {hotelServices[selectedHotel._id].map((service) => (
                      <Col md={6} key={service._id}>
                        <div className="service-card">
                          <div className="service-card-header">
                            <div className="service-icon">
                              <i className={service.icon}></i>
                            </div>
                            <div className="service-info">
                              <h6 className="service-name">{service.name}</h6>
                              <Badge bg={service.isFree ? 'success' : 'primary'} className="service-price-badge">
                                {service.isFree ? 'Miễn phí' : formatPriceVND(service.price)}
                              </Badge>
                            </div>
                          </div>
                          <div className="service-card-body">
                            <p className="service-description">{service.description}</p>
                            <div className="service-details">
                              <div className="service-detail">
                                <i className="fas fa-clock me-2"></i>
                                {service.operatingHours.open} - {service.operatingHours.close}
                              </div>
                              {service.capacity > 0 && (
                                <div className="service-detail">
                                  <i className="fas fa-users me-2"></i>
                                  Tối đa {service.capacity} người
                                </div>
                              )}
                              {service.requiresBooking && (
                                <div className="service-detail">
                                  <i className="fas fa-calendar-check me-2"></i>
                                  Cần đặt trước
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Đang tải dịch vụ...</p>
              </div>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </section>
  );
};

export default RoomResults;