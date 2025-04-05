import React, { useState } from 'react';
import { Modal, Button, Carousel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function Room({ room }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate(); // Hook điều hướng

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleBooking = () => {
    navigate(`/book/${room._id}`)
  };

  return (
    <div className="row">
      <div className="col-md-4">
        <img
          src={room.imageurls?.[0] || "default-image.jpg"}
          className="smallimg"
          alt={room.name}
          onError={(e) => { e.target.src = "default-image.jpg"; }}
        />
      </div>
      <div className="col-md-7">
        <h4>{room.name}</h4>
        <p>Số lượng phòng: {room.maxcount}</p>
        <p>Số điện thoại: {room.phonenumber}</p>
        <p>Loại: {room.type}</p>

        <div style={{ float: 'right' }}>
          <button className="btn btn-primary" onClick={handleShow}>View Details</button>
          <button className="btn btn-success ms-2" onClick={handleBooking}>Book Now</button>
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
          <p>{room.description}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Room;
