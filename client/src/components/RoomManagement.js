import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Table, Button, Alert } from 'react-bootstrap';

const RoomManagement = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || userInfo.role !== 'admin') {
          setError('Bạn không có quyền truy cập trang này');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const response = await axios.get('http://localhost:5000/api/rooms/getallrooms', config);
        setRooms(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải danh sách phòng');
      }
    };

    fetchRooms();
  }, []);

  const handleEdit = (roomId) => {
    navigate(`/admin/editroom/${roomId}`);
  };

  return (
    <Container className="my-5">
      <h2 className="mb-4">Quản Lý Phòng</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Button
        variant="primary"
        className="mb-3"
        onClick={() => navigate('/admin/createroom')}
      >
        Tạo Phòng Mới
      </Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Tên Phòng</th>
            <th>Loại</th>
            <th>Giá/Ngày</th>
            <th>Số Người Tối Đa</th>
            <th>Trạng Thái</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room._id}>
              <td>{room.name}</td>
              <td>{room.type}</td>
              <td>{room.rentperday}</td>
              <td>{room.maxcount}</td>
              <td>{room.availabilityStatus}</td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleEdit(room._id)}
                >
                  Sửa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default RoomManagement;