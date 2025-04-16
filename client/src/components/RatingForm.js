import React, { useState } from "react";

function RatingForm({ onSubmit, hasBooked, rooms, selectedRoom, setSelectedRoom, submitStatus }) {
  const [formData, setFormData] = useState({
    userName: "",
    rating: "",
    comment: "",
    image: null,
    userEmail: localStorage.getItem("userEmail") || "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) {
      alert("Vui lòng chọn một phòng để đánh giá!");
      return;
    }
    if (!formData.userEmail) {
      alert("Email không hợp lệ. Vui lòng đặt phòng trước khi gửi đánh giá.");
      return;
    }
    setFormLoading(true);
    const data = new FormData();
    data.append("roomId", selectedRoom);
    data.append("userName", formData.userName);
    data.append("rating", formData.rating);
    data.append("comment", formData.comment);
    data.append("userEmail", formData.userEmail);
    if (formData.image) {
      data.append("image", formData.image);
    }
    await onSubmit(data);
    setFormLoading(false);
  };

  return (
    <div className="rating-form-container">
      {submitStatus && (
        <div className={`alert ${submitStatus.type === "success" ? "alert-success" : "alert-danger"}`}>
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
            disabled={rooms.length === 0 || formLoading}
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
                placeholder="Nhập tên của bạn"
                required
                disabled={formLoading}
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
                placeholder="Email của bạn"
                required
                disabled
              />
              {!formData.userEmail && (
                <p className="text-danger mt-1">
                  Email không hợp lệ. Vui lòng đặt phòng trước khi gửi đánh giá.
                </p>
              )}
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
                placeholder="Nhập số sao (1-5)"
                required
                disabled={formLoading}
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
                placeholder="Nhập nội dung đánh giá của bạn"
                required
                disabled={formLoading}
              ></textarea>
            </div>
            <div className="form-group">
              <label>Ảnh minh họa (tùy chọn):</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleFileChange}
                disabled={formLoading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading || !formData.userEmail}
            >
              {formLoading ? "Đang gửi..." : "Gửi đánh giá"}
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