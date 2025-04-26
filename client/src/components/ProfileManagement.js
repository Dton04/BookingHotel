import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Navbar from './Navbar';
import '../css/ProfileManagement.css';
import { useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/images/default-avatar.jpg';

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
      console.log('Fetching profile with token:', userInfo.token);
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      const userData = response.data;
      setUser({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        avatar: userData.avatar || '',
        bookingsCount: userData.bookingsCount || 0,
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
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        alert('Không thể tải thông tin hồ sơ: ' + (error.response?.data?.message || error.message));
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
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAvatar(file);
      const reader = new FileReader();
      reader.onload = () => {
        setUser((prev) => {
          console.log('Preview URL:', reader.result);
          return { ...prev, avatar: reader.result };
        });
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (newAvatar) {
        console.log('Uploading avatar:', newAvatar);
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
        console.log('Updating profile with data:', { name: user.name, phone: user.phone });
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

      console.log('Update response:', response.data);
      alert('Cập nhật hồ sơ thành công');
      setUser({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        avatar: response.data.avatar || '',
        bookingsCount: response.data.bookingsCount || 0,
      });
      setNewAvatar(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (
        error.response?.status === 401 &&
        (error.response.data.message === 'Not authorized, token expired' ||
          error.response.data.message === 'Not authorized, no token provided')
      ) {
        localStorage.removeItem('userInfo');
        navigate('/login', { replace: true });
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        alert('Lỗi khi cập nhật hồ sơ: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);

    if (newPassword !== confirmNewPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      setPasswordLoading(false);
      return;
    }
    if (!oldPassword) {
      alert('Vui lòng nhập mật khẩu cũ để thay đổi mật khẩu!');
      setPasswordLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải dài ít nhất 6 ký tự!');
      setPasswordLoading(false);
      return;
    }

    try {
      const updateData = {
        oldPassword,
        newPassword,
      };
      console.log('Updating password with data:', updateData);
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

      console.log('Password update response:', response.data);
      alert('Cập nhật mật khẩu thành công');
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
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        alert('Lỗi khi cập nhật mật khẩu: ' + (error.response?.data?.message || error.message));
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
        <h2>My Profile</h2>
        <div className="profile-container">
          <div className="avatar-section">
            <img
              src={user.avatar ? `${API_BASE_URL}${user.avatar}?t=${new Date().getTime()}` : defaultAvatar}
              alt="Avatar"
              className="avatar-image"
            />
            <label htmlFor="avatar-upload" className="upload-button">
              Update Avatar
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <p className="avatar-note">For best results, use a square image</p>
          </div>
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleInputChange}
                required
              />
              <span className="edit-icon"></span>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={user.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
              <span className="edit-icon"></span>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={user.email}
                disabled
              />
              <span className="lock-icon"></span>
            </div>
            <div className="form-group">
              <label>Total Bookings</label>
              <p className="disabled-field">{user.bookingsCount}</p>
              <span className="lock-icon"></span>
            </div>
            <div className="form-group">
              <label>Password</label>
              <button
                type="button"
                className="change-password-button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                Change Password
              </button>
            </div>
            {showPasswordForm && (
              <div className="password-form">
                <div className="form-group">
                  <label>Old Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter your old password"
                  />
                  <span className="edit-icon"></span>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                  />
                  <span className="edit-icon"></span>
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                  <span className="edit-icon"></span>
                </div>
                <button
                  type="button"
                  className="update-password-button"
                  onClick={handlePasswordUpdate}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
            <button type="submit" className="update-button" disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfileManagement;