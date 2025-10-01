import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./../css/booking-form.css";

function BookingForm() {
  const [formData, setFormData] = useState({
    destination: "",
    checkin: "",
    checkout: "",
    adults: 2,
    children: 0,
    rooms: 1,
  });

  const [regions, setRegions] = useState([]);
  const [filteredRegions, setFilteredRegions] = useState([]);
  const [openGuestDropdown, setOpenGuestDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Lấy danh sách regions từ API
  useEffect(() => {
    axios.get("/api/regions")
      .then((response) => setRegions(response.data))
      .catch((err) => console.error("Lỗi lấy regions:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "destination") {
      if (value.trim() === "") {
        setFilteredRegions([]);
      } else {
        const filtered = regions.filter((region) =>
          region.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredRegions(filtered);
      }
    }
  };

  const handleSelectRegion = (regionName) => {
    setFormData((prev) => ({ ...prev, destination: regionName }));
    setFilteredRegions([]);
  };

  const handleCounter = (field, delta) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lưu vào localStorage để fallback ở các trang khác (như HotelDetail)
    localStorage.setItem('bookingInfo', JSON.stringify(formData));
    navigate(`/room-results?${new URLSearchParams(formData).toString()}`);
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenGuestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="booking-search-bar">
      <form onSubmit={handleSubmit} className="booking-search-form">
        {/* Địa điểm + autocomplete */}
        <div className="destination-wrapper">
          <input
            type="text"
            name="destination"
            placeholder="Bạn muốn đến đâu?"
            value={formData.destination}
            onChange={handleChange}
            className="search-input"
            required
          />
          {filteredRegions.length > 0 && (
            <ul className="autocomplete-list">
              {filteredRegions.map((region) => (
                <li
                  key={region._id}
                  onClick={() => handleSelectRegion(region.name)}
                >
                  <span className="location-icon">📍</span> {region.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ngày nhận */}
        <input
          type="date"
          name="checkin"
          value={formData.checkin}
          onChange={handleChange}
          className="search-input"
          required
        />

        {/* Ngày trả */}
        <input
          type="date"
          name="checkout"
          value={formData.checkout}
          onChange={handleChange}
          className="search-input"
          required
        />

        {/* Ô chọn khách & phòng */}
        <div className="guest-dropdown-wrapper" ref={dropdownRef}>
          <div
            className="search-input guest-input"
            onClick={() => setOpenGuestDropdown(!openGuestDropdown)}
          >
            {formData.adults} người lớn · {formData.children} trẻ em · {formData.rooms} phòng
          </div>

          {openGuestDropdown && (
            <div className="guest-dropdown">
              <div className="dropdown-row">
                <span>Người lớn</span>
                <div className="counter">
                  <button type="button" onClick={() => handleCounter("adults", -1)}>-</button>
                  <span>{formData.adults}</span>
                  <button type="button" onClick={() => handleCounter("adults", 1)}>+</button>
                </div>
              </div>
              <div className="dropdown-row">
                <span>Trẻ em</span>
                <div className="counter">
                  <button type="button" onClick={() => handleCounter("children", -1)}>-</button>
                  <span>{formData.children}</span>
                  <button type="button" onClick={() => handleCounter("children", 1)}>+</button>
                </div>
              </div>
              <div className="dropdown-row">
                <span>Phòng</span>
                <div className="counter">
                  <button type="button" onClick={() => handleCounter("rooms", -1)}>-</button>
                  <span>{formData.rooms}</span>
                  <button type="button" onClick={() => handleCounter("rooms", 1)}>+</button>
                </div>
              </div>
              <div className="dropdown-actions">
                <button type="button" onClick={() => setOpenGuestDropdown(false)}>
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nút tìm */}
        <button type="submit" className="search-button">
          Tìm
        </button>
      </form>
    </div>
  );
}

export default BookingForm;