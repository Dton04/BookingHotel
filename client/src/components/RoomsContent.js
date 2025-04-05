import React, { useState, useEffect } from "react";
import axios from "axios";
import Room from "./Room";

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
      <h2>OUR ROOMS</h2>
      <h1>Explore Our <span>ROOMS</span></h1>
      <div className="container">
        <div className="row justify-content-center mt-5">
          {loading ? (
            <h1>Loading...</h1>
          ) : error ? (
            <h1>Error</h1>
          ) : (
            rooms.map((room, index) => (
              <div key={index} className="col-md-9 mt-2">
                <div className="shadow-lg p-4 rounded-lg bg-white">
                  <Room room={room} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default RoomsContent;