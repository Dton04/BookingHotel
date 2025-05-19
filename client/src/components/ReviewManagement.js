import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Container, Form, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const params = {
        ...filters,
        status: filters.status === 'all' ? undefined : filters.status,
      };

      const response = await axios.get('/api/reviews', { params, ...config });
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lấy danh sách đánh giá');
      setLoading(false);
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

  // Chuyển trang
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
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

  return (
    <Container className="my-5">
      <h2>Quản lý đánh giá</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form className="mb-4">
        <Form.Group className="mb-3">
          <Form.Label>ID khách sạn</Form.Label>
          <Form.Control
            type="text"
            name="hotelId"
            value={filters.hotelId}
            onChange={handleFilterChange}
            placeholder="Nhập ID khách sạn"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={filters.email}
            onChange={handleFilterChange}
            placeholder="Nhập email"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Trạng thái</Form.Label>
          <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="active">Đang hoạt động</option>
            <option value="hidden">Đã ẩn</option>
            <option value="deleted">Đã xóa</option>
            <option value="all">Tất cả</option>
          </Form.Select>
        </Form.Group>
      </Form>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Khách sạn</th>
                <th>Phòng</th>
                <th>Tên người dùng</th>
                <th>Điểm</th>
                <th>Bình luận</th>
                <th>Email</th>
                <th>Ngày tạo</th>
                <th>Trạng thái hiển thị</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review._id}>
                  <td>{review.hotelId?.name || 'N/A'}</td>
                  <td>{review.roomId?.name || 'N/A'}</td>
                  <td>{review.userName}</td>
                  <td>{review.rating}</td>
                  <td>{review.comment}</td>
                  <td>{review.email}</td>
                  <td>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    {review.isVisible ? 'Hiển thị' : 'Đã ẩn'}
                    {!review.isVisible && (
                      <span style={{ color: 'red', fontWeight: 'bold', marginLeft: '5px' }}>
                        (Đã ẩn)
                      </span>
                    )}
                  </td>
                  <td>
                    <Button
                      variant={review.isVisible ? 'warning' : 'success'}
                      size="sm"
                      onClick={() => toggleVisibility(review._id)}
                      className="me-2"
                      disabled={review.isDeleted}
                    >
                      {review.isVisible ? 'Ẩn' : 'Hiển thị'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteReview(review._id)}
                      disabled={review.isDeleted}
                    >
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-between mt-3">
            <Button
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
            >
              Trang trước
            </Button>
            <span>Trang {filters.page} / {totalPages}</span>
            <Button
              disabled={filters.page === totalPages}
              onClick={() => handlePageChange(filters.page + 1)}
            >
              Trang sau
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default ReviewManagement;