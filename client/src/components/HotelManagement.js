import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Alert, Form } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/HotelManagement.css';

const HotelManagement = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Lấy danh sách khu vực
    const fetchRegions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/regions');
        setRegions(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi lấy danh sách khu vực');
      }
    };

    fetchRegions();
  }, []);

  useEffect(() => {
    // Lấy danh sách khách sạn
    const fetchHotels = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        let url = 'http://localhost:5000/api/hotels';
        if (selectedRegion) {
          url = `http://localhost:5000/api/hotels/by-region/${selectedRegion}`;
        }
        const response = await axios.get(url, config);
        setHotels(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi lấy danh sách khách sạn');
      }
    };
    fetchHotels();
  }, [selectedRegion]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa khách sạn này?')) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.delete(`http://localhost:5000/api/hotels/${id}`, config);
      setHotels(hotels.filter((hotel) => hotel._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi xóa khách sạn');
    }
  };

  const handleRegionChange = (e) => {
    setSelectedRegion(e.target.value);
  };

  return (
    <Container className="my-5 hotel-management">
      <h2>Quản Lý Khách Sạn</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="filter-section">
        <Form.Group className="mb-3">
          <Form.Label>Lọc theo khu vực</Form.Label>
          <Form.Select value={selectedRegion} onChange={handleRegionChange}>
            <option value="">Tất cả khu vực</option>
            {regions.map((region) => (
              <option key={region._id} value={region._id}>
                {region.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Button
          variant="primary"
          className="create-hotel-btn"
          onClick={() => navigate('/admin/createhotel')}
        >
          Tạo Khách Sạn Mới
        </Button>
      </div>
      <Table striped bordered hover className="hotel-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Địa Chỉ</th>
            <th>Khu Vực</th>
            <th>Số Điện Thoại</th>
            <th>Email</th>
            <th>Phòng</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {hotels.map((hotel) => (
            <tr key={hotel._id}>
              <td>{hotel.name}</td>
              <td>{hotel.address}</td>
              <td>{hotel.region?.name || 'N/A'}</td>
              <td>{hotel.contactNumber}</td>
              <td>{hotel.email}</td>
              <td>{hotel.rooms.map((room) => room.name).join(', ') || 'N/A'}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2 action-btn"
                  onClick={() => navigate(`/admin/edithotel/${hotel._id}`)}
                >
                  Sửa
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="action-btn"
                  onClick={() => handleDelete(hotel._id)}
                >
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default HotelManagement;