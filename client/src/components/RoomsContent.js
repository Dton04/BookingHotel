import React, { useState, useEffect } from "react";
import axios from "axios";
import Room from "./Room";
import './../css/rooms-content.css';

function RoomsContent() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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

  return (
    <section className="rooms-content">
      <div className="container">
        <div className="rooms-header text-center">
          <h2 className="subtitle">
            <span className="line"></span>
            OUR ROOMS
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Explore Our <span>ROOMS</span>
          </h1>
        </div>

        <div className="row mt-5">
          {loading ? (
            <div className="col-12 text-center">
              <h1>Loading...</h1>
            </div>
          ) : error ? (
            <div className="col-12 text-center">
              <h1>Error</h1>
            </div>
          ) : (
            rooms.map((room, index) => (
              <div key={index} className="col-lg-4 col-md-6 mb-4">
                <Room room={room} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default RoomsContent;