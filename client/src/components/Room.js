import React, { useState } from 'react';
import { Modal, Button, Carousel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function Room({ room }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleBooking = () => {
    navigate(`/book/${room._id}`);
  };

  // Hàm định dạng giá tiền sang VND
  const formatPriceVND = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 1000000); // Giá mặc định là 1,000,000 VND nếu không có rentperday
  };

  return (
    <div className="room-card">
      <div className="room-image">
        <img
          src={room.imageurls?.[0] || "default-image.jpg"}
          alt={room.name}
          className="img-fluid"
          onError={(e) => { e.target.src = "default-image.jpg"; }}
        />
      </div>
      <div className="room-content">
        <h4 className="room-title">{room.name}</h4>
        <p className="room-description">{room.description?.substring(0, 100)}...</p>
        <div className="room-details">
          <span className="room-price">{formatPriceVND(room.rentperday)} / Đêm</span>
          <button className="btn btn-details" onClick={handleShow}>Chi tiết</button>
        </div>
      </div>

      <Modal show={show} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{room.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Carousel data-bs-theme="dark">
            {room.imageurls.map((url, index) => (
              <Carousel.Item key={index}>
                <img className="d-block w-100 bigimg" src={url} alt={`slide-${index}`} />
              </Carousel.Item>
            ))}
          </Carousel>
          <p className="mt-3">{room.description}</p>
          <ul className="room-info">
            <li>Số lượng tối đa: {room.maxcount}</li>
            <li>Số điện thoại: {room.phonenumber}</li>
            <li>Loại: {room.type}</li>
            <li>Giá: {formatPriceVND(room.rentperday)} / Đêm</li>
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Đóng</Button>
          <Button variant="success" onClick={handleBooking}>Đặt ngay</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Room;