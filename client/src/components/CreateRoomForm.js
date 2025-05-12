import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Alert, Modal, Image } from 'react-bootstrap';
import '../css/CreateRoomForm.css';

const CreateRoomForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [formData, setFormData] = useState({
    name: '',
    maxcount: '',
    beds: '',
    baths: '',
    phonenumber: '',
    rentperday: '',
    type: '',
    description: '',
    hotel: '',
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Lấy danh sách khách sạn
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/hotels/public');
        setHotels(response.data);
      } catch (err) {
        setError('Lỗi khi lấy danh sách khách sạn');
        console.error('Error fetching hotels:', err);
      }
    };

    fetchHotels();

    // Nếu sửa, lấy dữ liệu phòng
    if (isEdit) {
      const fetchRoom = async () => {
        try {
          const userInfo = JSON.parse(localStorage.getItem('userInfo'));
          const config = {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          };
          const response = await axios.get(`http://localhost:5000/api/rooms/${id}`, config);
          setFormData({
            name: response.data.name || '',
            maxcount: response.data.maxcount || '',
            beds: response.data.beds || '',
            baths: response.data.baths || '',
            phonenumber: response.data.phonenumber || '',
            rentperday: response.data.rentperday || '',
            type: response.data.type || '',
            description: response.data.description || '',
            hotel: response.data.hotel?._id || '',
          });
          setExistingImages(response.data.imageurls || []);
        } catch (err) {
          setError('Lỗi khi lấy thông tin phòng');
          console.error('Error fetching room:', err);
        }
      };
      fetchRoom();
    }
  }, [id, isEdit]);

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
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.delete(`http://localhost:5000/api/rooms/${id}/images/${imgId}`, config);
      setExistingImages(existingImages.filter(url => !url.includes(imgId)));
      setSuccess('Xóa ảnh thành công');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa ảnh');
      console.error('Error deleting image:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate phonenumber
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(formData.phonenumber)) {
      setError('Số điện thoại phải có 10-11 chữ số');
      return;
    }

    // Validate numbers
    if (isNaN(formData.maxcount) || formData.maxcount <= 0) {
      setError('Số người tối đa phải là số dương');
      return;
    }
    if (isNaN(formData.beds) || formData.beds <= 0) {
      setError('Số giường phải là số dương');
      return;
    }
    if (isNaN(formData.baths) || formData.baths <= 0) {
      setError('Số phòng tắm phải là số dương');
      return;
    }
    if (isNaN(formData.rentperday) || formData.rentperday <= 0) {
      setError('Giá thuê mỗi ngày phải là số dương');
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || userInfo.role !== 'admin') {
        setError('Bạn không có quyền thực hiện hành động này');
        return;
      }

      const data = new FormData();
      data.append('name', formData.name);
      data.append('maxcount', formData.maxcount);
      data.append('beds', formData.beds);
      data.append('baths', formData.baths);
      data.append('phonenumber', formData.phonenumber);
      data.append('rentperday', formData.rentperday);
      data.append('type', formData.type);
      data.append('description', formData.description);
      data.append('hotel', formData.hotel);
      images.forEach((image) => data.append('images', image));

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      if (isEdit) {
        await axios.put(`http://localhost:5000/api/rooms/${id}`, data, config);
        setSuccess('Cập nhật phòng thành công!');
      } else {
        await axios.post('http://localhost:5000/api/rooms', data, config);
        setSuccess('Tạo phòng thành công!');
      }

      setTimeout(() => navigate('/admin/rooms'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || `Lỗi khi ${isEdit ? 'cập nhật' : 'tạo'} phòng`);
      console.error('Error submitting form:', err);
    }
  };

  const handleDelete = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.delete(`http://localhost:5000/api/rooms/${id}`, config);
      setSuccess('Xóa phòng thành công!');
      setShowDeleteConfirm(false);
      setTimeout(() => navigate('/admin/rooms'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa phòng');
      console.error('Error deleting room:', err);
    }
  };

  return (
    <Container className="my-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <h2 className="mb-4">{isEdit ? 'Sửa Phòng' : 'Tạo Phòng Mới'}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Tên Phòng</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nhập tên phòng"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="hotel">
              <Form.Label>Khách Sạn</Form.Label>
              <Form.Select
                name="hotel"
                value={formData.hotel}
                onChange={handleChange}
                required
              >
                <option value="">Chọn khách sạn</option>
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="maxcount">
                  <Form.Label>Số Người Tối Đa</Form.Label>
                  <Form.Control
                    type="number"
                    name="maxcount"
                    value={formData.maxcount}
                    onChange={handleChange}
                    required
                    placeholder="Nhập số người tối đa"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="beds">
                  <Form.Label>Số Giường</Form.Label>
                  <Form.Control
                    type="number"
                    name="beds"
                    value={formData.beds}
                    onChange={handleChange}
                    required
                    placeholder="Nhập số giường"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="baths">
                  <Form.Label>Số Phòng Tắm</Form.Label>
                  <Form.Control
                    type="number"
                    name="baths"
                    value={formData.baths}
                    onChange={handleChange}
                    required
                    placeholder="Nhập số phòng tắm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="rentperday">
                  <Form.Label>Giá Thuê Mỗi Ngày</Form.Label>
                  <Form.Control
                    type="number"
                    name="rentperday"
                    value={formData.rentperday}
                    onChange={handleChange}
                    required
                    placeholder="Nhập giá thuê"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="phonenumber">
              <Form.Label>Số Điện Thoại</Form.Label>
              <Form.Control
                type="text"
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                required
                placeholder="Nhập số điện thoại"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="type">
              <Form.Label>Loại Phòng</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Chọn loại phòng</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Suite">Suite</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Mô Tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Nhập mô tả phòng"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="images">
              <Form.Label>Ảnh Phòng (Tối đa 5 ảnh)</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageChange}
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
                      <Image src={url} alt={`Room-${index}`} thumbnail style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteImage(url.split('/').pop())}
                        className="delete-image-btn"
                      >
                        Xóa
                      </Button>
                    </div>
                  ))}
                </div>
              </Form.Group>
            )}

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit">
                {isEdit ? 'Cập Nhật Phòng' : 'Tạo Phòng'}
              </Button>
              {isEdit && (
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Xóa Phòng
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/rooms')}
              >
                Hủy
              </Button>
            </div>
          </Form>

          {/* Modal xác nhận xóa */}
          <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Xác nhận xóa phòng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Bạn có chắc chắn muốn xóa phòng này? Hành động này không thể hoàn tác.
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Xóa
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateRoomForm;