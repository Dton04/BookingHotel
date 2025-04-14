// RatingForm.js
import React, { useState, useEffect } from 'react';

function RatingForm({ onSubmit, hasBooked, rooms, selectedRoom, setSelectedRoom, submitStatus }) {
  const [formData, setFormData] = useState({
    userName: '',
    rating: 0,
    comment: '',
    image: null,
    userEmail: localStorage.getItem('userEmail') || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('roomId', selectedRoom);
    data.append('userName', formData.userName);
    data.append('rating', formData.rating);
    data.append('comment', formData.comment);
    data.append('userEmail', formData.userEmail);
    if (formData.image) {
      data.append('image', formData.image);
    }
    onSubmit(data);
  };

  return (
    <div className="rating-form-container">
      {submitStatus && (
        <div className={`alert ${submitStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {submitStatus.message}
        </div>
      )}
      <form className="rating-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Chọn phòng:</label>
          <select
            className="form-control"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            required
          >
            <option value="" disabled>
              Chọn một phòng
            </option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        {hasBooked ? (
          <>
            <div className="form-group">
              <label>Tên của bạn:</label>
              <input
                type="text"
                className="form-control"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email của bạn:</label>
              <input
                type="email"
                className="form-control"
                name="userEmail"
                value={formData.userEmail}
                onChange={handleInputChange}
                required
                disabled
              />
            </div>
            <div className="form-group">
              <label>Đánh giá (1-5 sao):</label>
              <input
                type="number"
                className="form-control"
                name="rating"
                min="1"
                max="5"
                value={formData.rating}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nội dung đánh giá:</label>
              <textarea
                className="form-control"
                name="comment"
                rows="3"
                value={formData.comment}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label>Ảnh minh họa:</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Gửi đánh giá
            </button>
          </>
        ) : (
          <p className="text-danger">Bạn cần đặt phòng này trước khi gửi đánh giá.</p>
        )}
      </form>
    </div>
  );
}

export default RatingForm;