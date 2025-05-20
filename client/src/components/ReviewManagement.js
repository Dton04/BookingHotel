import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Container, Form, Alert, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/reviewManagement.css';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    hotelId: '',
    email: '',
    status: 'active',
    page: 1,
    limit: 10,
  });
  const [totalPages, setTotalPages] = useState(1);

  // Lấy danh sách đánh giá
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo?.token) {
        throw new Error('Không tìm thấy thông tin người dùng hoặc token');
      }
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const params = { ...filters };

      const response = await axios.get('/api/reviews', { params, ...config });
      setReviews(response.data.reviews || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lấy danh sách đánh giá');
      setLoading(false);
      toast.error(err.response?.data?.message || 'Lỗi khi lấy danh sách đánh giá');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  // Reset bộ lọc
  const resetFilters = () => {
    setFilters({
      hotelId: '',
      email: '',
      status: 'active',
      page: 1,
      limit: 10,
    });
  };

  // Chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Bật/tắt hiển thị đánh giá
  const toggleVisibility = async (reviewId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const response = await axios.patch(`/api/reviews/${reviewId}/toggle-hidden`, {}, config);
      toast.success(response.data.message);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái hiển thị');
    }
  };

  // Xóa mềm đánh giá
  const deleteReview = async (reviewId) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const response = await axios.delete(`/api/reviews/${reviewId}`, config);
        toast.success(response.data.message);
        fetchReviews();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa đánh giá');
      }
    }
  };

  // Render skeleton loading
  const renderSkeleton = () => (
    <div className="skeleton-table">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="skeleton-row">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="skeleton-cell"></div>
          ))}
        </div>
      ))}
    </div>
  );

  // Render tooltip
  const renderTooltip = (message) => (
    <Tooltip>{message}</Tooltip>
  );

  // Render phân trang động
  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, filters.page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          className={`pagination-btn ${filters.page === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="pagination">
        <Button
          className="pagination-btn"
          disabled={filters.page === 1}
          onClick={() => handlePageChange(1)}
        >
          <i className="fas fa-angle-double-left"></i> Đầu
        </Button>
        <Button
          className="pagination-btn"
          disabled={filters.page === 1}
          onClick={() => handlePageChange(filters.page - 1)}
        >
          <i className="fas fa-angle-left"></i> Trước
        </Button>
        {pages}
        <Button
          className="pagination-btn"
          disabled={filters.page === totalPages}
          onClick={() => handlePageChange(filters.page + 1)}
        >
          Sau <i className="fas fa-angle-right"></i>
        </Button>
        <Button
          className="pagination-btn"
          disabled={filters.page === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          Cuối <i className="fas fa-angle-double-right"></i>
        </Button>
        <span className="pagination-info">Trang {filters.page} / {totalPages}</span>
      </div>
    );
  };

  return (
    <Container className="review-management">
      <h2>Quản lý đánh giá</h2>
      {error && <Alert variant="danger" className="modern-alert">{error}</Alert>}
      <Form className="filters">
        <div className="filter-group">
          <Form.Label>ID khách sạn</Form.Label>
          <Form.Control
            type="text"
            name="hotelId"
            value={filters.hotelId}
            onChange={handleFilterChange}
            placeholder="Nhập ID khách sạn"
            className="modern-input"
          />
        </div>
        <div className="filter-group">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={filters.email}
            onChange={handleFilterChange}
            placeholder="Nhập email"
            className="modern-input"
          />
        </div>
        <div className="filter-group">
          <Form.Label>Trạng thái</Form.Label>
          <Form.Select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="modern-select"
          >
            <option value="active">Đang hoạt động</option>
            <option value="hidden">Đã ẩn</option>
            <option value="deleted">Đã xóa</option>
          </Form.Select>
        </div>
        <div className="filter-actions">
          <button type="button" className="filter-btn search" onClick={fetchReviews}>
            <i className="fas fa-search"></i> Tìm kiếm
          </button>
          <button type="button" className="filter-btn reset" onClick={resetFilters}>
            <i className="fas fa-undo"></i> Đặt lại
          </button>
        </div>
      </Form>

      {loading ? (
        renderSkeleton()
      ) : reviews.length === 0 ? (
        <Alert variant="info" className="modern-alert">
          Không có đánh giá nào phù hợp với bộ lọc.
        </Alert>
      ) : (
        <div className="table-wrapper">
          <Table striped bordered hover responsive className="review-table">
            <thead>
              <tr>
                <th className="col-hotel">Khách sạn</th>
                <th className="col-room">Phòng</th>
                <th className="col-user">Tên người dùng</th>
                <th className="col-rating">Điểm</th>
                <th className="col-comment">Bình luận</th>
                <th className="col-email">Email</th>
                <th className="col-date">Ngày tạo</th>
                <th className="col-status">Trạng thái</th>
                <th className="col-action">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id} className="fade-in">
                  <td className="col-hotel">{review.hotelId?.name || 'N/A'}</td>
                  <td className="col-room">{review.roomId?.name || 'N/A'}</td>
                  <td className="col-user">{review.userName}</td>
                  <td className="col-rating">
                    <Badge bg="warning" text="dark">
                      {review.rating}/5
                    </Badge>
                  </td>
                  <td className="col-comment">{review.comment}</td>
                  <td className="col-email">{review.email}</td>
                  <td className="col-date">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="col-status">
                    {review.isDeleted ? (
                      <Badge bg="danger">Đã xóa</Badge>
                    ) : review.isVisible ? (
                      <Badge bg="success">Hiển thị</Badge>
                    ) : (
                      <Badge bg="secondary">Đã ẩn</Badge>
                    )}
                  </td>
                  <td className="col-action">
                    <OverlayTrigger
                      placement="top"
                      overlay={renderTooltip(review.isVisible ? 'Ẩn đánh giá' : 'Hiển thị đánh giá')}
                    >
                      <Button
                        variant={review.isVisible ? 'warning' : 'success'}
                        size="sm"
                        onClick={() => toggleVisibility(review._id)}
                        className="action-btn toggle-btn me-2"
                        disabled={review.isDeleted}
                      >
                        <i className={review.isVisible ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                        {review.isVisible ? ' Ẩn' : ' Hiển thị'}
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      overlay={renderTooltip('Xóa đánh giá')}
                    >
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteReview(review._id)}
                        className="action-btn delete-btn"
                        disabled={review.isDeleted}
                      >
                        <i className="fas fa-trash"></i> Xóa
                      </Button>
                    </OverlayTrigger>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mobile-cards">
            {reviews.map((review) => (
              <div key={review._id} className="review-card fade-in">
                <div className="review-card-header">
                  <span className="review-card-title">{review.hotelId?.name || 'N/A'}</span>
                  <Badge
                    bg={review.isDeleted ? 'danger' : review.isVisible ? 'success' : 'secondary'}
                  >
                    {review.isDeleted ? 'Đã xóa' : review.isVisible ? 'Hiển thị' : 'Đã ẩn'}
                  </Badge>
                </div>
                <div className="review-card-body">
                  <div className="review-field"><span className="field-label">Phòng:</span> {review.roomId?.name || 'N/A'}</div>
                  <div className="review-field"><span className="field-label">Người dùng:</span> {review.userName}</div>
                  <div className="review-field"><span className="field-label">Điểm:</span> <Badge bg="warning" text="dark">{review.rating}/5</Badge></div>
                  <div className="review-field"><span className="field-label">Bình luận:</span> {review.comment}</div>
                  <div className="review-field"><span className="field-label">Email:</span> {review.email}</div>
                  <div className="review-field"><span className="field-label">Ngày tạo:</span> {new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
                <div className="review-card-actions">
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip(review.isVisible ? 'Ẩn đánh giá' : 'Hiển thị đánh giá')}
                  >
                    <Button
                      variant={review.isVisible ? 'warning' : 'success'}
                      size="sm"
                      onClick={() => toggleVisibility(review._id)}
                      className="action-btn toggle-btn"
                      disabled={review.isDeleted}
                    >
                      <i className={review.isVisible ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                      {review.isVisible ? ' Ẩn' : ' Hiển thị'}
                    </Button>
                  </OverlayTrigger>
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip('Xóa đánh giá')}
                  >
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteReview(review._id)}
                      className="action-btn delete-btn"
                      disabled={review.isDeleted}
                    >
                      <i className="fas fa-trash"></i> Xóa
                    </Button>
                  </OverlayTrigger>
                </div>
              </div>
            ))}
          </div>
          {renderPagination()}
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </Container>
  );
};

export default ReviewManagement;