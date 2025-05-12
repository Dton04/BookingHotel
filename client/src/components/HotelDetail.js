import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Alert, Carousel } from "react-bootstrap";
import axios from "axios";
import Room from "./Room";
import "../css/HotelDetail.css";

const HotelDetail = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotelAndRooms = async () => {
      try {
        setLoading(true);
        // Lấy thông tin khách sạn
        const hotelResponse = await axios.get(`http://localhost:5000/api/hotels/${hotelId}`);
        setHotel(hotelResponse.data);

        // Lấy danh sách phòng theo khách sạn
        const roomsResponse = await axios.get("http://localhost:5000/api/rooms", {
          params: { hotel: hotelId },
        });
        setRooms(roomsResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi tải thông tin khách sạn hoặc phòng");
        console.error("Error fetching hotel/rooms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelAndRooms();
  }, [hotelId]);

  if (loading) {
    return (
      <Container className="my-5">
        <p>Đang tải...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Row>
        <Col>
          <Card className="mb-4 hotel-card">
            <Card.Body>
              <Card.Title>{hotel?.name || "Khách sạn không xác định"}</Card.Title>
              {hotel?.imageurls?.length > 0 && (
                <Carousel className="mb-3 hotel-carousel" interval={3000}>
                  {hotel.imageurls.map((url, index) => (
                    <Carousel.Item key={index}>
                      <img
                        className="d-block w-100"
                        src={url}
                        alt={`Hotel-${index}`}
                        style={{ height: "400px", objectFit: "cover" }}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              )}
              <Card.Text>
                <strong>Địa chỉ:</strong> {hotel?.address || "Không có thông tin"} <br />
                <strong>Số điện thoại:</strong> {hotel?.contactNumber || "Không có thông tin"} <br />
                <strong>Email:</strong> {hotel?.email || "Không có thông tin"} <br />
                <strong>Mô tả:</strong> {hotel?.description || "Khách sạn cung cấp dịch vụ tiện nghi và thoải mái."}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col>
          <h3>Danh sách phòng ({rooms.length})</h3>
          {rooms.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {rooms.map((room) => (
                <Col key={room._id}>
                  <Room room={room} showModalOnClick={true} />
                </Col>
              ))}
            </Row>
          ) : (
            <Alert variant="info">Khách sạn này hiện chưa có phòng nào.</Alert>
          )}
        </Col>
      </Row>
      <Row className="mt-4">
        <Col className="text-center">
          <Button variant="secondary" className="btn-modern" onClick={() => navigate("/hotels")}>
            Quay lại danh sách khách sạn
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default HotelDetail; 