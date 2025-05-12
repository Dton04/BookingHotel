import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../css/voucherManagement.css';

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    applicableHotels: [],
    startDate: '',
    endDate: '',
    minBookingAmount: 0,
    maxDiscount: null,
    isStackable: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rooms, setRooms] = useState([]);
  const vouchersPerPage = 10;

  useEffect(() => {
    fetchVouchers();
    fetchRooms();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await axios.get('/api/vouchers/admin', {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` },
      });
      setVouchers(response.data);
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách voucher');
      console.error(error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms/getallrooms');
      setRooms(response.data);
    } catch (error) {
      toast.error('Lỗi khi lấy danh sách phòng');
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    if (name === 'discountValue' || name === 'minBookingAmount' || name === 'maxDiscount') {
      newValue = parseFloat(value) || 0;
      if (name === 'discountValue' && formData.discountType === 'percentage' && newValue > 100) {
        setFormErrors((prev) => ({ ...prev, discountValue: 'Phần trăm không được vượt quá 100' }));
        return;
      } else {
        setFormErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleRoomSelection = (roomId) => {
    setFormData((prev) => {
      const applicableHotels = prev.applicableHotels.includes(roomId)
        ? prev.applicableHotels.filter((id) => id !== roomId)
        : [...prev.applicableHotels, roomId];
      return { ...prev, applicableHotels };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code) errors.code = 'Mã voucher là bắt buộc';
    if (formData.discountValue <= 0) errors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    if (!formData.startDate) errors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.endDate) errors.endDate = 'Ngày kết thúc là bắt buộc';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    if (formData.applicableHotels.length === 0) errors.applicableHotels = 'Chọn ít nhất một khách sạn';
    if (formData.minBookingAmount < 0) errors.minBookingAmount = 'Số tiền tối thiểu không được âm';
    if (formData.maxDiscount && formData.maxDiscount < 0) errors.maxDiscount = 'Giảm giá tối đa không được âm';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkCodeExists = async (code) => {
    try {
      const response = await axios.get(`/api/vouchers/check-code/${code}`, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` },
      });
      return response.data.exists;
    } catch (error) {
      return false;
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const codeExists = await checkCodeExists(formData.code);
    if (codeExists) {
      setFormErrors((prev) => ({ ...prev, code: 'Mã voucher đã tồn tại' }));
      return;
    }

    try {
      await axios.post('/api/vouchers/hotel-specific', formData, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` },
      });
      toast.success('Thêm voucher thành công');
      setShowAddForm(false);
      resetForm();
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm voucher');
      console.error(error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await axios.put('/api/vouchers/override', { voucherId: currentVoucher._id, ...formData }, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` },
      });
      toast.success('Cập nhật voucher thành công');
      setShowEditForm(false);
      resetForm();
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật voucher');
      console.error(error);
    }
  };

  const handleDelete = async (voucherId) => {
    if (window.confirm('Bạn có chắc muốn xóa voucher này?')) {
      try {
        await axios.delete(`/api/vouchers/${voucherId}`, {
          headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` },
        });
        toast.success('Xóa voucher thành công');
        fetchVouchers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi xóa voucher');
        console.error(error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      applicableHotels: [],
      startDate: '',
      endDate: '',
      minBookingAmount: 0,
      maxDiscount: null,
      isStackable: false,
    });
    setFormErrors({});
    setCurrentVoucher(null);
  };

  const openEditForm = (voucher) => {
    setCurrentVoucher(voucher);
    setFormData({
      code: voucher.code,
      description: voucher.description || '',
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      applicableHotels: voucher.applicableHotels.map(hotel => hotel._id || hotel),
      startDate: new Date(voucher.startDate).toISOString().split('T')[0],
      endDate: new Date(voucher.endDate).toISOString().split('T')[0],
      minBookingAmount: voucher.minBookingAmount,
      maxDiscount: voucher.maxDiscount,
      isStackable: voucher.isStackable,
    });
    setShowEditForm(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const filteredVouchers = vouchers.filter(
    (voucher) =>
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.applicableHotels.some((hotel) =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const indexOfLastVoucher = currentPage * vouchersPerPage;
  const indexOfFirstVoucher = indexOfLastVoucher - vouchersPerPage;
  const currentVouchers = filteredVouchers.slice(indexOfFirstVoucher, indexOfLastVoucher);
  const totalPages = Math.ceil(filteredVouchers.length / vouchersPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="voucher-management container">
      <h2>Quản Lý Voucher</h2>
      <div className="search-and-add">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Tìm kiếm theo mã hoặc khách sạn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          Thêm Voucher Mới
        </button>
      </div>

      <div className="voucher-list">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Loại Giảm Giá</th>
              <th>Giá Trị</th>
              <th>Khách Sạn Áp Dụng</th>
              <th>Ngày Bắt Đầu</th>
              <th>Ngày Kết Thúc</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {currentVouchers.map((voucher) => (
              <tr key={voucher._id}>
                <td>{voucher.code}</td>
                <td>{voucher.discountType === 'percentage' ? 'Phần trăm' : 'Cố định'}</td>
                <td>
                  {voucher.discountType === 'percentage'
                    ? `${voucher.discountValue}%`
                    : formatCurrency(voucher.discountValue)}
                </td>
                <td>
                  {voucher.applicableHotels.length > 0
                    ? voucher.applicableHotels.map((hotel) => hotel.name).join(', ')
                    : 'Không có khách sạn áp dụng'}
                </td>
                <td>{new Date(voucher.startDate).toLocaleDateString('vi-VN')}</td>
                <td>{new Date(voucher.endDate).toLocaleDateString('vi-VN')}</td>
                <td>
                  <button className="btn btn-warning btn-sm mr-2" onClick={() => openEditForm(voucher)}>
                    Sửa
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(voucher._id)}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>
      </div>

      {(showAddForm || showEditForm) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{showAddForm ? 'Thêm Voucher Mới' : 'Sửa Voucher'}</h3>
            <form onSubmit={showAddForm ? handleAddSubmit : handleEditSubmit}>
              <div className="form-group">
                <label title="Mã duy nhất để khách hàng nhập">Mã Voucher</label>
                <input
                  type="text"
                  className={`form-control ${formErrors.code ? 'is-invalid' : ''}`}
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  disabled={showEditForm}
                />
                {formErrors.code && <div className="invalid-feedback">{formErrors.code}</div>}
              </div>
              <div className="form-group">
                <label title="Mô tả chi tiết về voucher">Mô Tả</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label title="Chọn loại giảm giá: phần trăm hoặc số tiền cố định">Loại Giảm Giá</label>
                <select
                  className="form-control"
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                >
                  <option value="percentage">Phần trăm</option>
                  <option value="fixed">Cố định</option>
                </select>
              </div>
              <div className="form-group">
                <label title="Nhập giá trị giảm: % (0-100) hoặc số tiền (VNĐ)">Giá Trị Giảm Giá</label>
                <input
                  type="number"
                  className={`form-control ${formErrors.discountValue ? 'is-invalid' : ''}`}
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  min="0"
                  step={formData.discountType === 'percentage' ? '1' : '1000'}
                  required
                />
                {formErrors.discountValue && <div className="invalid-feedback">{formErrors.discountValue}</div>}
              </div>
              <div className="form-group">
                <label title="Chọn các khách sạn/phòng áp dụng voucher">Khách Sạn Áp Dụng</label>
                <div className={`room-selection ${formErrors.applicableHotels ? 'is-invalid' : ''}`}>
                  {rooms.map((room) => (
                    <div key={room._id}>
                      <input
                        type="checkbox"
                        id={room._id}
                        value={room._id}
                        checked={formData.applicableHotels.includes(room._id)}
                        onChange={() => handleRoomSelection(room._id)}
                      />
                      <label htmlFor={room._id}>{room.name}</label>
                    </div>
                  ))}
                </div>
                {formErrors.applicableHotels && (
                  <div className="invalid-feedback">{formErrors.applicableHotels}</div>
                )}
              </div>
              <div className="form-group">
                <label title="Ngày bắt đầu áp dụng voucher">Ngày Bắt Đầu</label>
                <input
                  type="date"
                  className={`form-control ${formErrors.startDate ? 'is-invalid' : ''}`}
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.startDate && <div className="invalid-feedback">{formErrors.startDate}</div>}
              </div>
              <div className="form-group">
                <label title="Ngày kết thúc áp dụng voucher">Ngày Kết Thúc</label>
                <input
                  type="date"
                  className={`form-control ${formErrors.endDate ? 'is-invalid' : ''}`}
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.endDate && <div className="invalid-feedback">{formErrors.endDate}</div>}
              </div>
              <div className="form-group">
                <label title="Số tiền đặt phòng tối thiểu để áp dụng voucher">Số Tiền Đặt Phòng Tối Thiểu</label>
                <input
                  type="number"
                  className={`form-control ${formErrors.minBookingAmount ? 'is-invalid' : ''}`}
                  name="minBookingAmount"
                  value={formData.minBookingAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
                {formErrors.minBookingAmount && (
                  <div className="invalid-feedback">{formErrors.minBookingAmount}</div>
                )}
              </div>
              <div className="form-group">
                <label title="Số tiền giảm tối đa (chỉ áp dụng cho loại phần trăm)">Giảm Giá Tối Đa</label>
                <input
                  type="number"
                  className={`form-control ${formErrors.maxDiscount ? 'is-invalid' : ''}`}
                  name="maxDiscount"
                  value={formData.maxDiscount || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
                {formErrors.maxDiscount && <div className="invalid-feedback">{formErrors.maxDiscount}</div>}
              </div>
              <div className="form-group">
                <label title="Cho phép sử dụng cùng các voucher khác">
                  <input
                    type="checkbox"
                    name="isStackable"
                    checked={formData.isStackable}
                    onChange={handleInputChange}
                  />
                  Cho phép chồng khuyến mãi
                </label>
              </div>
              <button type="submit" className="btn btn-primary">
                {showAddForm ? 'Thêm' : 'Cập nhật'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  resetForm();
                }}
              >
                Hủy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherManagement;