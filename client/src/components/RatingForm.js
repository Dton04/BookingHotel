// RatingForm.js
import React, { useState } from 'react';
import '../css/rating-form.css';

const RatingForm = ({ onSubmit, hasBooked }) => {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasBooked) {
      setError('Bạn cần đặt phòng trước khi đánh giá!');
      return;
    }
    if (rating === 0) {
      setError('Vui lòng chọn số sao!');
      return;
    }
    if (!content) {
      setError('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    const formData = new FormData();
    formData.append('rating', rating);
    formData.append('content', content);
    if (image) formData.append('image', image);

    onSubmit(formData);
    setRating(0);
    setContent('');
    setImage(null);
    setPreview(null);
    setError('');
  };

  if (!hasBooked) {
    return (
      <div className="rating-message-container">
        <div className="message-icon">🏡</div>
        <h3>Khám phá trải nghiệm tuyệt vời!</h3>
        <p className="rating-message">
          Để chia sẻ đánh giá của bạn, hãy đặt phòng ngay hôm nay và bắt đầu hành trình đáng nhớ!
        </p>
        <a href="/rooms" className="booking-link">
          <span className="booking-link-icon">🚪</span> Đặt phòng ngay
        </a>
      </div>
    );
  }

  return (
    <div className="rating-form-container">
      <h3>Chia sẻ trải nghiệm của bạn</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Đánh giá của bạn:</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? 'filled' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Nội dung đánh giá:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Hãy chia sẻ cảm nhận của bạn về trải nghiệm này..."
            rows="5"
          />
        </div>

        <div className="form-group">
          <label>Thêm ảnh (tùy chọn):</label>
          <div className="image-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <span className="upload-icon">📷</span> Chọn ảnh
            </label>
            {preview && (
              <div className="image-preview">
                <img src={preview} alt="Preview" />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => {
                    setImage(null);
                    setPreview(null);
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={rating === 0 || !content}>
          Gửi đánh giá
        </button>
      </form>
    </div>
  );
};

export default RatingForm;