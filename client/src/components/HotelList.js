import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/HotelList.css";

const HotelList = () => {
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/hotels/public");
        setHotels(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi tải danh sách khách sạn");
        console.error("Error fetching hotels:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

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
      <h2>Danh sách khách sạn</h2>
      <Row xs={1} md={2} lg={3} className="g-4">
        {hotels.map((hotel) => (
          <Col key={hotel._id}>
            <Card className="hotel-card">
              <Card.Img
                variant="top"
                src={hotel.imageurls?.[0] || "/images/default-hotel.jpg"}
                alt={hotel.name}
                onError={(e) => {
                  e.target.src = "/images/default-hotel.jpg";
                }}
              />
              <Card.Body>
                <Card.Title>{hotel.name}</Card.Title>
                <Card.Text>
                  <strong>Địa chỉ:</strong> {hotel.address || "Không có thông tin"} <br />
                  <strong>Số điện thoại:</strong> {hotel.contactNumber || "Không có thông tin"} <br />
                  <strong>Mô tả:</strong>{" "}
                  {hotel.description?.substring(0, 100) || "Khách sạn cung cấp dịch vụ tiện nghi và thoải mái."}...
                </Card.Text>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/hotels/${hotel._id}`)}
                >
                  Xem phòng
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default HotelList;