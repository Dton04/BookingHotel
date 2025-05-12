import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/reviewManagement.css';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, approved, pending
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

  // Hàm lấy token từ localStorage
  const getToken = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo);
        return parsedUserInfo.token; // Giả sử token nằm trong userInfo.token
      } catch (err) {
        console.error('Lỗi khi phân tích userInfo:', err);
        return null;
      }
    }
    return null;
  };

  // Cấu hình axios với token
  const axiosInstance = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor để thêm token vào mọi yêu cầu
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Lấy danh sách đánh giá
  useEffect(() => {
    const fetchData = async () => {
      try {
        const reviewsResponse = await axiosInstance.get('/reviews');

        // Kiểm tra và trích xuất mảng reviews từ response
        const reviewsData = Array.isArray(reviewsResponse.data.reviews)
          ? reviewsResponse.data.reviews
          : Array.isArray(reviewsResponse.data)
            ? reviewsResponse.data
            : [];

        setReviews(reviewsData);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi lấy dữ liệu');
        setLoading(false);
        toast.error(err.response?.data?.message || 'Lỗi khi lấy dữ liệu');
      }
    };

    fetchData();
  }, []);

  // Xử lý xóa đánh giá
  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      try {
        await axiosInstance.delete(`/reviews/${reviewId}`);
        setReviews(reviews.filter((review) => review._id !== reviewId));
        toast.success('Xóa đánh giá thành công');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi khi xóa đánh giá');
      }
    }
  };

  // Xử lý duyệt đánh giá
  const handleApproveReview = async (reviewId) => {
    try {
      await axiosInstance.patch(`/reviews/${reviewId}/approve`);
      setReviews(
        reviews.map((review) =>
          review._id === reviewId ? { ...review, isApproved: true } : review
        )
      );
      toast.success('Duyệt đánh giá thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi duyệt đánh giá');
    }
  };

  // Xử lý toggle hiển thị
  const handleToggleVisibility = async (reviewId) => {
    try {
      const response = await axiosInstance.patch(`/reviews/${reviewId}/toggle-visibility`);
      setReviews(
        reviews.map((review) =>
          review._id === reviewId ? { ...review, isVisible: response.data.review.isVisible } : review
        )
      );
      toast.success('Cập nhật trạng thái hiển thị thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái hiển thị');
    }
  };

  // Lọc đánh giá theo tìm kiếm và trạng thái
  const filteredReviews = Array.isArray(reviews)
    ? reviews.filter((review) => {
        const roomName = review.roomId?.name || 'Không xác định';
        const matchesSearch =
          review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          roomName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'approved' && review.isApproved) ||
          (filterStatus === 'pending' && !review.isApproved);
        return matchesSearch && matchesStatus && !review.isDeleted;
      })
    : [];

  // Phân trang
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="text-center mt-5">Đang tải...</div>;
  }

  if (error) {
    return <div className="modern-alert alert-danger">{error}</div>;
  }

  return (
    <div className="review-management-page">
      <div className="container">
        <div className="review-management-header">
          <h2 className="title">
            Quản Lý <span>Đánh Giá</span>
          </h2>
        </div>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="mb-4 d-flex gap-3">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm theo tên, email, bình luận hoặc phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-select w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chưa duyệt</option>
          </select>
        </div>

        {currentReviews.length === 0 ? (
          <p>Chưa có đánh giá nào.</p>
        ) : (
          <div className="modern-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Phòng</th>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Điểm</th>
                  <th>Bình luận</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Hiển thị</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentReviews.map((review) => (
                  <tr key={review._id}>
                    <td>{review.roomId?.name || 'Không xác định'}</td>
                    <td>{review.userName}</td>
                    <td>{review.email}</td>
                    <td>{review.rating}/5</td>
                    <td>{review.comment}</td>
                    <td>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>{review.isApproved ? 'Đã duyệt' : 'Chưa duyệt'}</td>
                    <td>{review.isVisible ? 'Hiển thị' : 'Ẩn'}</td>
                    <td>
                      {!review.isApproved && (
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => handleApproveReview(review._id)}
                        >
                          Duyệt
                        </button>
                      )}
                      <button
                        className={`btn btn-${review.isVisible ? 'warning' : 'info'} btn-sm me-2`}
                        onClick={() => handleToggleVisibility(review._id)}
                      >
                        {review.isVisible ? 'Ẩn' : 'Hiển thị'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteReview(review._id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phân trang */}
            <nav>
              <ul className="pagination justify-content-center">
                {Array.from({ length: totalPages }, (_, index) => (
                  <li
                    key={index + 1}
                    className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    <button className="page-link" onClick={() => paginate(index + 1)}>
                      {index + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ReviewManagement;