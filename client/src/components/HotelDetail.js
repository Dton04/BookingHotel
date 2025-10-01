import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Tabs,
  Tab,
  ListGroup,
  Spinner,
  Alert,
  Modal
} from 'react-bootstrap';
import {
  FaStar,
  FaMapMarkerAlt,
  FaWifi,
  FaParking,
  FaSwimmingPool,
  FaCoffee,
  FaBed,
  FaBath,
  FaUserFriends,
  FaCheck,
  FaRegCalendarAlt,
  FaPhoneAlt,
  FaEnvelope,     // bổ sung icon email
  FaHeart,
  FaRegHeart
} from 'react-icons/fa';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import '../css/hotel-detail.css';


const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const getBookingInfo = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const checkin = urlParams.get('checkin');

      // Ưu tiên query params từ URL (nếu có)
      if (checkin) {
        return {
          checkin: checkin || '',
          checkout: urlParams.get('checkout') || '',
          adults: urlParams.get('adults') || '2',
          children: urlParams.get('children') || '0',
          rooms: urlParams.get('rooms') || '1'
        };
      } else {
        // Fallback về localStorage (dữ liệu từ BookingForm trước đó)
        const stored = localStorage.getItem('bookingInfo');
        if (stored) {
          const data = JSON.parse(stored);
          return {
            checkin: data.checkin || '',
            checkout: data.checkout || '',
            adults: data.adults || '2',
            children: data.children || '0',
            rooms: data.rooms || '1'
          };
        }
        // Default nếu không có gì
        return {
          checkin: '',
          checkout: '',
          adults: '2',
          children: '0',
          rooms: '1'
        };
      }
    } catch (error) {
      console.error('Error parsing booking info:', error);
      return {
        checkin: '',
        checkout: '',
        adults: '2',
        children: '0',
        rooms: '1'
      };
    }
  };
  const [bookingInfo, setBookingInfo] = useState(getBookingInfo());

  // Cập nhật bookingInfo khi URL thay đổi
  useEffect(() => {
    setBookingInfo(getBookingInfo());
  }, [location.search]);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      if (!id) {
        setError('ID khách sạn không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Lấy thông tin từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const checkin = urlParams.get('checkin');
        const checkout = urlParams.get('checkout');
        const adults = urlParams.get('adults');
        const children = urlParams.get('children');

        // Fetch hotel details với phòng trống (nếu có đủ thông tin)
        let hotelUrl = `http://localhost:5000/api/hotels/${id}`;
        if (checkin && checkout && adults) {
          hotelUrl = `http://localhost:5000/api/hotels/${id}/available-rooms?checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children || 0}`;
        }

        const hotelResponse = await axios.get(hotelUrl);
        if (!hotelResponse.data) {
          throw new Error('Không tìm thấy thông tin khách sạn');
        }
        setHotel(hotelResponse.data);

        // Fetch services
        try {
          const servicesResponse = await axios.get(`http://localhost:5000/api/services/hotel/${id}`);
          setServices(servicesResponse.data);
        } catch (serviceError) {
          console.error('Error fetching services:', serviceError);
          setServices([]);
        }

        // Fetch reviews (tạm thời comment lại vì chưa có API)
        // const reviewsResponse = await axios.get(`/api/reviews/hotel/${id}`);
        // setReviews(reviewsResponse.data);
        // if (reviewsResponse.data.length > 0) {
        //   const avgRating = reviewsResponse.data.reduce((acc, review) => acc + review.rating, 0) / reviewsResponse.data.length;
        //   setAverageRating(avgRating);
        // }

      } catch (error) {
        console.error('Error fetching hotel details:', error);
        setError(
          error.response?.data?.message ||
          error.message ||
          'Có lỗi xảy ra khi tải thông tin khách sạn'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [id]);

  const handleBookNow = (room) => {
    // Lấy thông tin từ bookingInfo state
    const { checkin, checkout, adults, children } = bookingInfo;

    if (!checkin || !checkout) {
      setError('Vui lòng chọn ngày nhận phòng và trả phòng');
      return;
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    // Kiểm tra tính hợp lệ của ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
      setError('Ngày không hợp lệ. Vui lòng chọn lại.');
      return;
    }

    if (checkinDate < today) {
      setError('Ngày nhận phòng không thể là ngày trong quá khứ');
      return;
    }

    if (checkinDate >= checkoutDate) {
      setError('Ngày trả phòng phải sau ngày nhận phòng');
      return;
    }

    // Chuyển đến trang đặt phòng với đầy đủ thông tin
    navigate(`/book/${room._id}`, {
      state: {
        roomId: room._id,
        roomType: room.type,
        hotelName: hotel.name,
        hotelId: hotel._id,
        checkin: checkin,
        checkout: checkout,
        adults: parseInt(adults),
        children: parseInt(children) || 0,
        rentPerDay: room.rentperday
      }
    });
  };

  const formatPriceVND = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite functionality
  };

  if (loading) {
    return (
      <Container className="text-center my-5 py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin khách sạn...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Đã xảy ra lỗi</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={() => window.history.back()} variant="outline-danger">
              <i className="fas fa-arrow-left me-2"></i>
              Quay lại trang trước
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!hotel) {
    return (
      <Container className="my-5">
        <Alert variant="warning">
          <Alert.Heading>Không tìm thấy thông tin</Alert.Heading>
          <p>Không tìm thấy thông tin khách sạn hoặc khách sạn không tồn tại.</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button onClick={() => window.history.back()} variant="outline-warning">
              <i className="fas fa-arrow-left me-2"></i>
              Quay lại trang trước
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  const galleryImages = (hotel.imageurls || []).map(url => ({
    original: url,
    thumbnail: url,
  }));

  return (
    <div className="hotel-detail-page">
      {/* Header Section */}
      <div className="hotel-header py-4 bg-white shadow-sm">
        <Container>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex align-items-center">
                <h1 className="hotel-name h2 mb-0">{hotel.name}</h1>
                <Button
                  variant="link"
                  className="ms-2 p-0 text-danger"
                  onClick={toggleFavorite}
                >
                  {isFavorite ? <FaHeart size={24} /> : <FaRegHeart size={24} />}
                </Button>
              </div>
              <div className="d-flex align-items-center mt-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <FaStar
                    key={index}
                    className={index < Math.round(averageRating) ? 'text-warning' : 'text-muted'}
                  />
                ))}
                {averageRating && (
                  <span className="ms-2 text-muted">
                    {averageRating.toFixed(1)} ({reviews.length} đánh giá)
                  </span>
                )}
              </div>
              <p className="mb-0 mt-2">
                <FaMapMarkerAlt className="text-primary me-2" />
                {hotel.address}
              </p>
            </div>
            <Button
              variant="outline-primary"
              onClick={() => window.history.back()}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Quay lại
            </Button>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="my-4">
        <Row>
          <Col lg={8}>
            {/* Gallery Section */}
            <Card className="mb-4">
              <Card.Body className="p-0">
                <ImageGallery
                  items={galleryImages}
                  showPlayButton={false}
                  showFullscreenButton={true}
                  showNav={true}
                  showThumbnails={true}
                  thumbnailPosition="bottom"
                  slideInterval={3000}
                  startIndex={selectedImageIndex}
                  onScreenChange={fullscreen => setIsGalleryOpen(fullscreen)}
                />
              </Card.Body>
            </Card>

            {/* Tabs Section */}
            <Card>
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-4"
                >
                  {/* Overview Tab */}
                  <Tab eventKey="overview" title="Tổng quan">
                    <div className="overview-section">
                      <h4>Giới thiệu</h4>
                      <p>{hotel.description}</p>

                      <h4 className="mt-4">Tiện nghi nổi bật</h4>
                      <Row className="g-3 mb-4">
                        {hotel.amenities?.map((amenity, index) => (
                          <Col md={4} key={index}>
                            <div className="amenity-item d-flex align-items-center">
                              <FaCheck className="text-success me-2" />
                              <span>{amenity}</span>
                            </div>
                          </Col>
                        ))}
                      </Row>

                      <h4>Dịch vụ khách sạn</h4>
                      <Row className="g-3">
                        {services.map((service) => (
                          <Col md={6} key={service._id}>
                            <Card className="h-100 service-card">
                              <Card.Body>
                                <div className="d-flex align-items-center">
                                  <i className={service.icon + " service-icon me-3"}></i>
                                  <div>
                                    <h6 className="mb-1">{service.name}</h6>
                                    <p className="mb-0 small text-muted">
                                      {service.description}
                                    </p>
                                    {!service.isFree && (
                                      <div className="text-primary mt-1">
                                        {formatPriceVND(service.price)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </Tab>

                  {/* Rooms Tab */}
                  <Tab eventKey="rooms" title="Phòng">
                    <div className="rooms-section">
                      {hotel.rooms?.map((room) => (
                        <Card key={room._id} className="room-card mb-4 shadow-sm border-0 rounded-3 overflow-hidden">
                          <Row className="g-0">
                            <Col md={4}>
                              <div className="room-image-wrapper">
                                <img
                                  src={room.imageurls?.[0] || '/images/default-room.jpg'}
                                  alt={room.type}
                                  className="room-image"
                                />
                              </div>
                            </Col>
                            <Col md={8}>
                              <Card.Body className="d-flex flex-column justify-content-between h-100">
                                <div>
                                  <h5 className="room-type mb-2 fw-bold">{room.type}</h5>
                                  <div className="room-features mb-3">
                                    <Badge bg="light" text="dark" className="me-2">
                                      <FaUserFriends className="me-1" />
                                      {room.maxcount} người
                                    </Badge>
                                    <Badge bg="light" text="dark" className="me-2">
                                      <FaBed className="me-1" />
                                      {room.beds} giường
                                    </Badge>
                                    <Badge bg="light" text="dark">
                                      <FaBath className="me-1" />
                                      {room.baths} phòng tắm
                                    </Badge>
                                  </div>
                                  <p className="room-description text-muted">{room.description}</p>
                                </div>
                                <div className="text-end">
                                  <div className="room-price mb-2">
                                    <small className="text-muted">Giá mỗi đêm từ</small>
                                    <div className="h4 mb-0 text-primary fw-bold">
                                      {formatPriceVND(room.rentperday)}
                                    </div>
                                  </div>
                                  <Button
                                    variant="primary"
                                    onClick={() => handleBookNow(room)}
                                    disabled={room.availabilityStatus !== 'available'}
                                  >
                                    {room.availabilityStatus === 'available' ? 'Đặt ngay' : 'Hết phòng'}
                                  </Button>
                                </div>
                              </Card.Body>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                    </div>
                  </Tab>


                  {/* Reviews Tab */}
                  <Tab eventKey="reviews" title={"Đánh giá (" + reviews.length + ")"}>
                    <div className="reviews-section">
                      <Row>
                        <Col md={4}>
                          <div className="rating-summary text-center mb-4">
                            <div className="average-rating display-4">
                              {averageRating ? averageRating.toFixed(1) : 'N/A'}
                            </div>
                            <div className="stars mb-2">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <FaStar
                                  key={index}
                                  className={
                                    index < Math.round(averageRating)
                                      ? 'text-warning'
                                      : 'text-muted'
                                  }
                                />
                              ))}
                            </div>
                            <div className="text-muted">
                              Dựa trên {reviews.length} đánh giá
                            </div>
                          </div>
                        </Col>
                        <Col md={8}>
                          {reviews.length > 0 ? (
                            reviews.map((review) => (
                              <Card key={review._id} className="mb-3">
                                <Card.Body>
                                  <div className="d-flex justify-content-between">
                                    <div>
                                      <h6 className="mb-1">{review.user?.name}</h6>
                                      <small className="text-muted">
                                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                      </small>
                                    </div>
                                    <div className="rating">
                                      <Badge bg="primary">
                                        <FaStar className="me-1" />
                                        {review.rating}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="mt-3 mb-0">{review.comment}</p>
                                </Card.Body>
                              </Card>
                            ))
                          ) : (
                            <Alert variant="info">
                              Chưa có đánh giá nào cho khách sạn này
                            </Alert>
                          )}
                        </Col>
                      </Row>
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Contact Info Card */}
            <Card className="mb-4">
              <Card.Body>
                <h5 className="card-title mb-4">Thông tin liên hệ</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <FaPhoneAlt className="me-2 text-primary" />
                    {hotel.contactNumber}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FaEnvelope className="me-2 text-primary" />
                    {hotel.email}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <FaMapMarkerAlt className="me-2 text-primary" />
                    {hotel.address}
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Booking Summary Card */}
            <Card className="mb-4">
              <Card.Body>
                <h5 className="card-title mb-4">Thông tin đặt phòng của bạn</h5>
                <div className="booking-info-container">
                  <div className="booking-info-item mb-3 p-2 bg-light rounded">
                    <div className="d-flex align-items-center mb-2">
                      <FaRegCalendarAlt className="text-primary me-2" />
                      <label className="text-muted mb-0">Thời gian lưu trú</label>
                    </div>
                    <div className="ms-4">
                      <div className="fw-bold">
                        Nhận phòng: {bookingInfo.checkin ?
                          new Date(bookingInfo.checkin).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }) :
                          'Chọn ngày nhận phòng'}
                      </div>
                      <div className="fw-bold">
                        Trả phòng: {bookingInfo.checkout ?
                          new Date(bookingInfo.checkout).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }) :
                          'Chọn ngày trả phòng'}
                      </div>
                    </div>
                  </div>

                  <div className="booking-info-item mb-3 p-2 bg-light rounded">
                    <div className="d-flex align-items-center mb-2">
                      <FaUserFriends className="text-primary me-2" />
                      <label className="text-muted mb-0">Số khách</label>
                    </div>
                    <div className="ms-4 fw-bold">
                      {bookingInfo.adults} người lớn
                      {Number(bookingInfo.children) > 0 &&
                        ` · ${bookingInfo.children} trẻ em`}
                    </div>
                  </div>

                  <div className="booking-info-item mb-3 p-2 bg-light rounded">
                    <div className="d-flex align-items-center mb-2">
                      <FaBed className="text-primary me-2" />
                      <label className="text-muted mb-0">Số phòng</label>
                    </div>
                    <div className="ms-4 fw-bold">
                      {bookingInfo.rooms} phòng
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <div className="h5 text-primary mb-3">
                    Giá phòng từ {formatPriceVND(Math.min(...hotel.rooms?.map(r => r.rentperday) || [0]))}
                    <small className="text-muted"> /đêm</small>
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100"
                    onClick={() => setActiveTab('rooms')}
                  >
                    <FaRegCalendarAlt className="me-2" />
                    Xem phòng trống
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Policies Card */}
            <Card>
              <Card.Body>
                <h5 className="card-title mb-4">Chính sách khách sạn</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <div className="d-flex">
                      <FaRegCalendarAlt className="me-2 text-primary" />
                      <div>
                        <strong>Nhận phòng:</strong>
                        <div>Từ 14:00</div>
                      </div>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <div className="d-flex">
                      <FaRegCalendarAlt className="me-2 text-primary" />
                      <div>
                        <strong>Trả phòng:</strong>
                        <div>Trước 12:00</div>
                      </div>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Room Modal */}
      <Modal
        show={showRoomModal}
        onHide={() => setShowRoomModal(false)}
        size="lg"
      >
        {selectedRoom && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selectedRoom.type}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {/* Room details */}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowRoomModal(false)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={() => handleBookNow(selectedRoom)}
                disabled={selectedRoom.status !== 'available'}
              >
                {selectedRoom.status === 'available' ? 'Đặt ngay' : 'Hết phòng'}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
}
export default HotelDetail;
