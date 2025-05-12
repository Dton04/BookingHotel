import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Alert, Modal, Image } from 'react-bootstrap';
import '../css/CreateHotelForm.css';

const CreateHotelForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    region: '',
    province: '',
    district: '',
    contactNumber: '',
    email: '',
    description: '',
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Kiểm tra token
  const getUserInfo = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.token || userInfo.role !== 'admin') {
      setError('Vui lòng đăng nhập với tài khoản admin');
      setTimeout(() => navigate('/login'), 2000);
      return null;
    }
    return userInfo;
  };

  // Lấy danh sách khu vực và tỉnh
  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo) return;

    const fetchRegions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/regions', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setRegions(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi lấy danh sách khu vực');
        console.error('Error fetching regions:', err.response?.data || err.message);
      }
    };

    const fetchProvinces = async () => {
      try {
        const response = await axios.get('https://provinces.open-api.vn/api/p/', {
          timeout: 5000,
        });
        setProvinces(response.data);
      } catch (err) {
        setError('Lỗi khi lấy danh sách tỉnh. Vui lòng thử lại.');
        console.error('Error fetching provinces:', err.response?.data || err.message);
      }
    };

    fetchRegions();
    fetchProvinces();

    // Nếu sửa, lấy dữ liệu khách sạn
    if (isEdit) {
      const fetchHotel = async () => {
        try {
          setLoading(true);
          const config = {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          };
          const response = await axios.get(`http://localhost:5000/api/hotels/${id}`, config);
          const hotelData = response.data;
          setFormData({
            name: hotelData.name || '',
            address: hotelData.address || '',
            region: hotelData.region?._id || hotelData.region || '',
            province: hotelData.province || '',
            district: hotelData.district || '',
            contactNumber: hotelData.contactNumber?.toString() || '',
            email: hotelData.email || '',
            description: hotelData.description || '',
          });
          setExistingImages(hotelData.imageurls || []);
        } catch (err) {
          setError(err.response?.data?.message || 'Lỗi khi lấy thông tin khách sạn');
          console.error('Error fetching hotel:', err.response?.data || err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchHotel();
    }
  }, [id, isEdit, navigate]);

  // Cập nhật danh sách huyện khi chọn tỉnh
  useEffect(() => {
    const fetchDistricts = async () => {
      if (formData.province && provinces.length > 0) {
        try {
          const province = provinces.find(p => p.name === formData.province);
          if (province?.code) {
            const response = await axios.get(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`, {
              timeout: 5000,
            });
            setDistricts(response.data.districts || []);
          }
        } catch (err) {
          setError('Lỗi khi lấy danh sách huyện');
          console.error('Error fetching districts:', err.response?.data || err.message);
        }
      } else {
        setDistricts([]);
      }
    };
    fetchDistricts();
  }, [formData.province, provinces]);

  const handleProvinceChange = (e) => {
    const provinceName = e.target.value;
    setFormData({ ...formData, province: provinceName, district: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + existingImages.length > 5) {
      setError('Tổng số ảnh không được vượt quá 5');
      return;
    }
    setImages(files);
  };

  const handleDeleteImage = async (imgId) => {
    const userInfo = getUserInfo();
    if (!userInfo) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.delete(`http://localhost:5000/api/hotels/${id}/images/${imgId}`, config);
      setExistingImages(existingImages.filter(url => !url.includes(imgId)));
      setSuccess('Xóa ảnh thành công');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa ảnh');
      console.error('Error deleting image:', err.response?.data || err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    const trimmedData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      region: formData.region,
      province: formData.province,
      district: formData.district,
      contactNumber: formData.contactNumber.trim(),
      email: formData.email.trim(),
      description: formData.description.trim(),
    };

    if (!trimmedData.name) {
      setError('Tên khách sạn không được để trống');
      setLoading(false);
      return;
    }
    if (!trimmedData.address) {
      setError('Địa chỉ không được để trống');
      setLoading(false);
      return;
    }
    if (!trimmedData.region) {
      setError('Vui lòng chọn khu vực');
      setLoading(false);
      return;
    }
    if (!trimmedData.province) {
      setError('Vui lòng chọn tỉnh/thành phố');
      setLoading(false);
      return;
    }
    if (!trimmedData.district) {
      setError('Vui lòng chọn quận/huyện');
      setLoading(false);
      return;
    }
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(trimmedData.contactNumber)) {
      setError('Số điện thoại phải có 10-11 chữ số');
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedData.email)) {
      setError('Email không hợp lệ');
      setLoading(false);
      return;
    }

    const userInfo = getUserInfo();
    if (!userInfo) {
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('name', trimmedData.name);
      data.append('address', trimmedData.address);
      data.append('region', trimmedData.region);
      data.append('province', trimmedData.province);
      data.append('district', trimmedData.district);
      data.append('contactNumber', trimmedData.contactNumber);
      data.append('email', trimmedData.email);
      data.append('description', trimmedData.description);
      images.forEach((image) => data.append('images', image));

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      console.log('Sending data:', Object.fromEntries(data));

      if (isEdit) {
        const response = await axios.put(`http://localhost:5000/api/hotels/${id}`, data, config);
        setSuccess('Cập nhật khách sạn thành công!');
        console.log('Update response:', response.data);
      } else {
        const response = await axios.post('http://localhost:5000/api/hotels', data, config);
        setSuccess('Tạo khách sạn thành công!');
        console.log('Create response:', response.data);
      }

      setTimeout(() => navigate('/admin/hotels'), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Lỗi khi ${isEdit ? 'cập nhật' : 'tạo'} khách sạn`;
      setError(errorMessage);
      console.error('Error submitting form:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const userInfo = getUserInfo();
    if (!userInfo) return;

    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const response = await axios.delete(`http://localhost:5000/api/hotels/${id}`, config);
      setSuccess('Xóa khách sạn thành công!');
      setShowDeleteConfirm(false);
      console.log('Delete response:', response.data);
      setTimeout(() => navigate('/admin/hotels'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa khách sạn');
      console.error('Error deleting hotel:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <h2 className="mb-4">{isEdit ? 'Sửa Khách Sạn' : 'Tạo Khách Sạn Mới'}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {loading && <p>Đang xử lý...</p>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Tên Khách Sạn</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nhập tên khách sạn"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="address">
              <Form.Label>Địa Chỉ</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Nhập địa chỉ"
                disabled={loading}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="province">
                  <Form.Label>Tỉnh/Thành phố</Form.Label>
                  <Form.Select
                    name="province"
                    value={formData.province}
                    onChange={handleProvinceChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.name}>
                        {province.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="district">
                  <Form.Label>Quận/Huyện</Form.Label>
                  <Form.Select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    disabled={!formData.province || loading}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((district) => (
                      <option key={district.code} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="region">
              <Form.Label>Khu Vực</Form.Label>
              <Form.Select
                name="region"
                value={formData.region}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Chọn khu vực</option>
                {regions.map((region) => (
                  <option key={region._id} value={region._id}>
                    {region.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="contactNumber">
                  <Form.Label>Số Điện Thoại</Form.Label>
                  <Form.Control
                    type="text"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                    placeholder="Nhập số điện thoại"
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Nhập email"
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Mô Tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập mô tả khách sạn"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="images">
              <Form.Label>Ảnh Khách Sạn (Tối đa 5 ảnh)</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Chọn ảnh JPEG, PNG hoặc GIF. Tối đa 5MB mỗi ảnh.
              </Form.Text>
            </Form.Group>

            {isEdit && existingImages.length > 0 && (
              <Form.Group className="mb-3" controlId="existingImages">
                <Form.Label>Ảnh Hiện Có</Form.Label>
                <div className="image-preview">
                  {existingImages.map((url, index) => (
                    <div key={index} className="image-container">
                      <Image src={url} alt={`Hotel-${index}`} thumbnail style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteImage(url.split('/').pop())}
                        className="delete-image-btn"
                        disabled={loading}
                      >
                        Xóa
                      </Button>
                    </div>
                  ))}
                </div>
              </Form.Group>
            )}

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {isEdit ? 'Cập Nhật Khách Sạn' : 'Tạo Khách Sạn'}
              </Button>
              {isEdit && (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                >
                  Xóa Khách Sạn
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/hotels')}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          </Form>

          <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Xác nhận xóa khách sạn</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Bạn có chắc chắn muốn xóa khách sạn này? Hành động này không thể hoàn tác.
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                Xóa
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateHotelForm;