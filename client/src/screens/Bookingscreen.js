import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function Bookingscreen() {
  const { roomid } = useParams(); // Lấy roomid từ URL
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post("/api/rooms/getroombyid", { roomid }); // Đảm bảo roomid đang có giá trị
        setRoom(data);
      } catch (error) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };    

    fetchRoomData();
  }, [roomid]);

  return (
    <div>
      {loading ? (
        <h1>Loading...</h1>
      ) : error ? (
        <h1>Error loading room details...</h1>
      ) : room ? (
        <div className="row">
          <div className="col-md-5">
            <h1>{room.name}</h1>
            <img src={room.imageurls[0]} className="bigimg" alt={room.name} />
          </div>
          <div className="col-md-5">
            <h1>Booking Details</h1> 
            <p><strong>Room Type:</strong> {room.type}</p>
            <p><strong>Max Count:</strong> {room.maxcount}</p>
            <p><strong>Phone Number:</strong> {room.phonenumber}</p>
            <p><strong>Description:</strong> {room.description}</p>
            <button className="btn btn-success">Confirm Booking</button>
          </div>
        </div>
      ) : (
        <h1>Room not found</h1>
      )}
    </div>
  );
}

export default Bookingscreen;
