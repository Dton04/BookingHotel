import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Navbar from './Navbar';
import '../css/ProfileManagement.css';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/images/default-avatar.jpg';
import { Button, Alert, Spinner } from 'react-bootstrap';

function ProfileManagement() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    bookingsCount: 0,
  });
  const [newAvatar, setNewAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const navigate = useNavigate();

  const userInfo = useMemo(() => {
    return JSON.parse(localStorage.getItem('userInfo'));
  }, []);

  const API_BASE_URL = 'http://localhost:5000';

  const fetchUserProfile = async () => {
    try {
      if (!userInfo || !userInfo.token) {
        throw new Error('No token found');
      }
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setUser({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        avatar: response.data.avatar || '',
        bookingsCount: response.data.bookingsCount || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (
        error.response?.status === 401 &&
        (error.response.data.message === 'Not authorized, token expired' ||
          error.response.data.message === 'Not authorized, no token provided' ||
          error.message === 'No token found')
      ) {
        localStorage.removeItem('userInfo');
        navigate('/login', { replace: true });
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(error.response?.data?.message || error.message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfo) {
      navigate('/login', { replace: true });
      return;
    }
    fetchUserProfile();
  }, [navigate, userInfo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra định dạng và kích thước
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Vui lòng chọn file JPEG, PNG hoặc GIF');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước file không được vượt quá 5MB');
        return;
      }

      setNewAvatar(file);
      const reader = new FileReader();
      reader.onload = () => {
        setUser((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        setError('Lỗi khi đọc file ảnh');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { avatar: '' },
        {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setUser((prev) => ({ ...prev, avatar: '' }));
      setNewAvatar(null);
      setSuccess('Xóa ảnh đại diện thành công');
    } catch (error) {
      console.error('Error removing avatar:', error);
      setError(error.response?.data?.message || 'Lỗi khi xóa ảnh đại diện');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let response;
      if (newAvatar) {
        const formData = new FormData();
        formData.append('name', user.name);
        formData.append('phone', user.phone);
        formData.append('avatar', newAvatar);
        response = await axios.put(`${API_BASE_URL}/api/users/profile`, formData, {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
          },
        });
      } else {
        response = await axios.put(
          `${API_BASE_URL}/api/users/profile`,
          { name: user.name, phone: user.phone },
          {
            headers: {
              Authorization: `Bearer ${userInfo?.token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      setUser({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        avatar: response.data.avatar || '',
        bookingsCount: response.data.bookingsCount || 0,
      });
      setNewAvatar(null);
      setSuccess('Cập nhật hồ sơ thành công');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (
        error.response?.status === 401 &&
        (error.response.data.message === 'Not authorized, token expired' ||
          error.response.data.message === 'Not authorized, no token provided')
      ) {
        localStorage.removeItem('userInfo');
        navigate('/login', { replace: true });
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      setPasswordLoading(false);
      return;
    }
    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu cũ');
      setPasswordLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải dài ít nhất 6 ký tự');
      setPasswordLoading(false);
      return;
    }

    try {
      const updateData = {
        oldPassword,
        newPassword,
      };
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess('Cập nhật mật khẩu thành công');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error updating password:', error);
      if (
        error.response?.status === 401 &&
        (error.response.data.message === 'Not authorized, token expired' ||
          error.response.data.message === 'Not authorized, no token provided')
      ) {
        localStorage.removeItem('userInfo');
        navigate('/login', { replace: true });
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(error.response?.data?.message || 'Lỗi khi cập nhật mật khẩu');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <Navbar />
      <div className="profile-management" style={{ marginTop: '120px' }}>
        <h2>Quản lý hồ sơ</h2>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}
        <div className="profile-container">
          <div className="avatar-section">
            <img
              src={user.avatar || defaultAvatar}
              alt="Avatar"
              className="avatar-image"
            />
            <div className="avatar-actions">
              <label htmlFor="avatar-upload" className="upload-button">
                {uploadLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  'Cập nhật ảnh'
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
                disabled={uploadLoading}
              />
              {user.avatar && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={uploadLoading}
                  className="remove-avatar-button"
                >
                  Xóa ảnh
                </Button>
              )}
            </div>
            <p className="avatar-note">
              Sử dụng ảnh vuông, tối đa 5MB (JPEG, PNG, GIF)
            </p>
          </div>
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleInputChange}
                required
              />
              <span className="edit-icon" />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={user.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
              />
              <span className="edit-icon" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={user.email} disabled />
              <span className="lock-icon" />
            </div>
            <div className="form-group">
              <label>Tổng số đặt phòng</label>
              <p className="disabled-field">{user.bookingsCount}</p>
              <span className="lock-icon" />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <Button
                variant="outline-primary"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                Đổi mật khẩu
              </Button>
            </div>
            {showPasswordForm && (
              <div className="password-form">
                <div className="form-group">
                  <label>Mật khẩu cũ</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu cũ"
                  />
                  <span className="edit-icon" />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                  />
                  <span className="edit-icon" />
                </div>
                <div className="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                  />
                  <span className="edit-icon" />
                </div>
                <Button
                  variant="primary"
                  onClick={handlePasswordUpdate}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    'Cập nhật mật khẩu'
                  )}
                </Button>
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={uploadLoading || loading}
            >
              {uploadLoading || loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                'Cập nhật hồ sơ'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileManagement;