import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Row, Col, Alert, Image, Modal } from 'react-bootstrap';
import '../css/CreateRoomForm.css';

const EditRoomForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    maxcount: '',
    beds: '',
    baths: '',
    phonenumber: '',
    rentperday: '',
    availabilityStatus: 'available',
    type: '',
    description: '',
    hotel: '',
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token || userInfo.role !== 'admin') {
          setError('Vui lòng đăng nhập với tài khoản admin');
          setTimeout(() => navigate('/login'), 2000);
          setLoading(false);
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };

        // Lấy danh sách khách sạn
        const hotelResponse = await axios.get('http://localhost:5000/api/hotels/public', config);
        setHotels(hotelResponse.data);
        console.log('Fetched hotels:', hotelResponse.data);

        // Lấy thông tin phòng
        const roomResponse = await axios.post(
          'http://localhost:5000/api/rooms/getroombyid',
          { roomid: id },
          config
        );
        const room = roomResponse.data;
        console.log('Fetched room data:', room);
        setFormData({
          name: room.name || '',
          maxcount: room.maxcount?.toString() || '',
          beds: room.beds?.toString() || '',
          baths: room.baths?.toString() || '',
          phonenumber: room.phonenumber?.toString() || '',
          rentperday: room.rentperday?.toString() || '',
          availabilityStatus: room.availabilityStatus || 'available',
          type: room.type || '',
          description: room.description || '',
          hotel: room.hotel?._id?.toString() || '',
        });
        setExistingImages(room.imageurls || []);
        setLoading(false);
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', {
          message: err.message,
          response: err.response?.data,
        });
        setError(err.response?.data?.message || 'Lỗi khi tải thông tin phòng');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

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
      setFormLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token || userInfo.role !== 'admin') {
        setError('Vui lòng đăng nhập với tài khoản admin');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.delete(`http://localhost:5000/api/rooms/${id}/images/${imgId}`, config);
      setExistingImages(existingImages.filter((url) => !url.includes(imgId)));
      setSuccess('Xóa ảnh thành công');
    } catch (err) {
      console.error('Lỗi xóa ảnh:', {
        message: err.message,
        response: err.response?.data,
      });
      setError(err.response?.data?.message || 'Lỗi khi xóa ảnh');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Tên phòng không được để trống');
      setFormLoading(false);
      return;
    }
    if (!formData.maxcount || isNaN(formData.maxcount) || Number(formData.maxcount) <= 0) {
      setError('Số người tối đa phải là số dương');
      setFormLoading(false);
      return;
    }
    if (!formData.beds || isNaN(formData.beds) || Number(formData.beds) <= 0) {
      setError('Số giường phải là số dương');
      setFormLoading(false);
      return;
    }
    if (!formData.baths || isNaN(formData.baths) || Number(formData.baths) <= 0) {
      setError('Số phòng tắm phải là số dương');
      setFormLoading(false);
      return;
    }
    const phoneRegex = /^\d{10,11}$/;
    if (!formData.phonenumber || !phoneRegex.test(formData.phonenumber)) {
      setError('Số điện thoại phải có 10-11 chữ số');
      setFormLoading(false);
      return;
    }
    if (!formData.rentperday || isNaN(formData.rentperday) || Number(formData.rentperday) <= 0) {
      setError('Giá thuê mỗi ngày phải là số dương');
      setFormLoading(false);
      return;
    }
    if (!formData.type) {
      setError('Vui lòng chọn loại phòng');
      setFormLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('Mô tả không được để trống');
      setFormLoading(false);
      return;
    }
    if (!formData.hotel) {
      setError('Vui lòng chọn khách sạn');
      setFormLoading(false);
      return;
    }
    if (!['available', 'maintenance', 'busy'].includes(formData.availabilityStatus)) {
      setError('Trạng thái không hợp lệ');
      setFormLoading(false);
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token || userInfo.role !== 'admin') {
        setError('Vui lòng đăng nhập với tài khoản admin');
        setTimeout(() => navigate('/login'), 2000);
        setFormLoading(false);
        return;
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('maxcount', Number(formData.maxcount));
      data.append('beds', Number(formData.beds));
      data.append('baths', Number(formData.baths));
      data.append('phonenumber', formData.phonenumber);
      data.append('rentperday', Number(formData.rentperday));
      data.append('availabilityStatus', formData.availabilityStatus);
      data.append('type', formData.type);
      data.append('description', formData.description.trim());
      data.append('hotel', formData.hotel);
      images.forEach((image) => data.append('images', image));

      console.log('Submitting form data:', {
        name: formData.name,
        maxcount: formData.maxcount,
        beds: formData.beds,
        baths: formData.baths,
        phonenumber: formData.phonenumber,
        rentperday: formData.rentperday,
        availabilityStatus: formData.availabilityStatus,
        type: formData.type,
        description: formData.description,
        hotel: formData.hotel,
        imagesCount: images.length,
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const response = await axios.put(`http://localhost:5000/api/rooms/${id}`, data, config);
      console.log('Update room response:', response.data);
      setSuccess('Cập nhật phòng thành công!');
      setTimeout(() => navigate('/admin/rooms'), 2000);
    } catch (err) {
      console.error('Lỗi cập nhật phòng:', {
        message: err.message,
        response: err.response?.data,
      });
      setError(err.response?.data?.message || 'Lỗi khi cập nhật phòng');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setFormLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token || userInfo.role !== 'admin') {
        setError('Vui lòng đăng nhập với tài khoản admin');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.delete(`http://localhost:5000/api/rooms/${id}`, config);
      setSuccess('Xóa phòng thành công!');
      setShowDeleteConfirm(false);
      setTimeout(() => navigate('/admin/rooms'), 2000);
    } catch (err) {
      console.error('Lỗi xóa phòng:', {
        message: err.message,
        response: err.response?.data,
      });
      setError(err.response?.data?.message || 'Lỗi khi xóa phòng');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <Container className="my-5"><h3>Đang tải...</h3></Container>;
  }

  return (
    <Container className="my-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <h2 className="mb-4">Chỉnh Sửa Phòng</h2>
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
                disabled={formLoading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="hotel">
              <Form.Label>Khách Sạn</Form.Label>
              <Form.Select
                name="hotel"
                value={formData.hotel}
                onChange={handleChange}
                required
                disabled={formLoading}
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
                    min="1"
                    placeholder="Nhập số người tối đa"
                    disabled={formLoading}
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
                    min="0"
                    placeholder="Nhập giá thuê"
                    disabled={formLoading}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="beds">
                  <Form.Label>Số Giường</Form.Label>
                  <Form.Control
                    type="number"
                    name="beds"
                    value={formData.beds}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Nhập số giường"
                    disabled={formLoading}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="baths">
                  <Form.Label>Số Phòng Tắm</Form.Label>
                  <Form.Control
                    type="number"
                    name="baths"
                    value={formData.baths}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Nhập số phòng tắm"
                    disabled={formLoading}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="phonenumber">
              <Form.Label>Số Điện Thoại Liên Hệ</Form.Label>
              <Form.Control
                type="text"
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                required
                placeholder="Nhập số điện thoại"
                disabled={formLoading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="type">
              <Form.Label>Loại Phòng</Form.Label>
              <Form.Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                disabled={formLoading}
              >
                <option value="">Chọn loại phòng</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Suite">Suite</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="availabilityStatus">
              <Form.Label>Trạng Thái</Form.Label>
              <Form.Select
                name="availabilityStatus"
                value={formData.availabilityStatus}
                onChange={handleChange}
                disabled={formLoading}
              >
                <option value="available">Có Sẵn</option>
                <option value="maintenance">Bảo Trì</option>
                <option value="busy">Đang Sử Dụng</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="images">
              <Form.Label>Ảnh Phòng (Tối đa 5 ảnh)</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif"
                onChange={handleImageChange}
                disabled={formLoading}
              />
              <Form.Text className="text-muted">
                Chọn ảnh JPEG, PNG hoặc GIF. Tối đa 5MB mỗi ảnh.
              </Form.Text>
            </Form.Group>

            {existingImages.length > 0 && (
              <Form.Group className="mb-3" controlId="existingImages">
                <Form.Label>Ảnh Hiện Có</Form.Label>
                <div className="image-preview">
                  {existingImages.map((url, index) => (
                    <div key={index} className="image-container">
                      <Image
                        src={url}
                        alt={`Room-${index}`}
                        thumbnail
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteImage(url.split('/').pop())}
                        className="delete-image-btn"
                        disabled={formLoading}
                      >
                        Xóa
                      </Button>
                    </div>
                  ))}
                </div>
              </Form.Group>
            )}

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
                disabled={formLoading}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={formLoading}>
                {formLoading ? 'Đang xử lý...' : 'Cập Nhật Phòng'}
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={formLoading}
              >
                Xóa Phòng
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/rooms')}
                disabled={formLoading}
              >
                Hủy
              </Button>
            </div>
          </Form>

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
                disabled={formLoading}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={formLoading}
              >
                Xóa
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Container>
  );
};

export default EditRoomForm;