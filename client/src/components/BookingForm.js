import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./../css/booking-form.css";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { FaMapMarkerAlt, FaRegCalendarAlt, FaUserFriends } from "react-icons/fa";

function BookingForm() {
  const [formData, setFormData] = useState({
    destination: "",
    destinationName: "",
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "destinationName" ? { destination: "" } : {}),
    }));

    if (name === "destinationName") {
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

  const handleSelectRegion = (region) => {
    setFormData((prev) => ({
      ...prev,
      destination: region._id,
      destinationName: region.name,
    }));
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
    // Chỉ gửi destination (region._id) cùng với các trường khác
    const submitData = {
      destination: formData.destination,
      checkin: formData.checkin,
      checkout: formData.checkout,
      adults: formData.adults,
      children: formData.children,
      rooms: formData.rooms,
    };
    // Lưu vào localStorage để fallback ở các trang khác (như HotelDetail)
    localStorage.setItem('bookingInfo', JSON.stringify(submitData));
    navigate(`/room-results?${new URLSearchParams(submitData).toString()}`);
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

        {/* Địa điểm */}
        <div className="input-wrapper">
          <FaMapMarkerAlt className="input-icon" />
          <input
            type="text"
            name="destinationName"
            placeholder="Bạn muốn đến đâu?"
            value={formData.destinationName}
            onChange={handleChange}
            className="search-input with-icon"
            required
          />
          {filteredRegions.length > 0 && (
            <ul className="autocomplete-list">
              {filteredRegions.map((region) => (
                <li key={region._id} onClick={() => handleSelectRegion(region)}>
                  <FaMapMarkerAlt className="list-icon" /> {region.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ngày nhận phòng */}
        <div className="input-wrapper">
          <FaRegCalendarAlt className="input-icon" />
          <DatePicker
            selected={formData.checkin}
            onChange={(date) => setFormData({ ...formData, checkin: date })}
            selectsStart
            startDate={formData.checkin}
            endDate={formData.checkout}
            placeholderText="Ngày nhận phòng"
            className="search-input with-icon"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        {/* Ngày trả phòng */}
        <div className="input-wrapper">
          <FaRegCalendarAlt className="input-icon" />
          <DatePicker
            selected={formData.checkout}
            onChange={(date) => setFormData({ ...formData, checkout: date })}
            selectsEnd
            startDate={formData.checkin}
            endDate={formData.checkout}
            minDate={formData.checkin}
            placeholderText="Ngày trả phòng"
            className="search-input with-icon"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        {/* Ô chọn khách & phòng */}
        <div className="input-wrapper guest-dropdown-wrapper" ref={dropdownRef}>
          <FaUserFriends className="input-icon" />
          <div
            className="search-input with-icon guest-input"
            onClick={() => setOpenGuestDropdown(!openGuestDropdown)}
          >
            {formData.adults} người lớn · {formData.rooms} phòng
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