import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/membership.css'; // Giả định có file CSS riêng

const Membership = () => {
  const [membershipData, setMembershipData] = useState(null);
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchMembershipData = async () => {
      try {
        const membershipResponse = await axios.get(`/api/users/membership/level/${userInfo._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        const pointsResponse = await axios.get('/api/users/points', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        setMembershipData(membershipResponse.data);
        setPointsData(pointsResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu thành viên');
        setLoading(false);
      }
    };

    fetchMembershipData();
  }, [navigate, userInfo]);

  const handleRedeemPoints = async (rewardId, pointsRequired) => {
    if (!userInfo) return;

    if (pointsData.points < pointsRequired) {
      alert('Bạn không đủ điểm để đổi thưởng này!');
      return;
    }

    try {
      // Giả định có API để đổi điểm lấy voucher
      await axios.post(
        '/api/rewards/redeem',
        { rewardId, userId: userInfo._id },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      alert('Đổi thưởng thành công!');
      // Cập nhật lại dữ liệu điểm số
      const pointsResponse = await axios.get('/api/users/points', {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setPointsData(pointsResponse.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi đổi thưởng');
    }
  };

  if (!userInfo) return null;
  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className="membership-container">
      <h2>Chương Trình Thành Viên</h2>
      <div className="membership-info">
        <h3>Cấp Độ: {membershipData.membershipLevel}</h3>
        <p>Điểm Tích Lũy: {pointsData.points} điểm</p>
      </div>

      <div className="points-history">
        <h4>Lịch Sử Giao Dịch Điểm</h4>
        {pointsData.recentTransactions.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Số Điểm</th>
                <th>Số Tiền</th>
                <th>Đặt Phòng</th>
              </tr>
            </thead>
            <tbody>
              {pointsData.recentTransactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{new Date(transaction.createdAt).toLocaleDateString()}</td>
                  <td>{transaction.pointsEarned} điểm</td>
                  <td>{transaction.amount.toLocaleString()} VNĐ</td>
                  <td>
                    {transaction.bookingId
                      ? `Từ ${new Date(transaction.bookingId.checkin).toLocaleDateString()} đến ${new Date(
                          transaction.bookingId.checkout
                        ).toLocaleDateString()}`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Chưa có giao dịch nào.</p>
        )}
      </div>

      <div className="rewards-section">
        <h4>Đổi Điểm Lấy Voucher</h4>
        {/* Giả định danh sách phần thưởng */}
        <div className="rewards-list">
          {[
            { id: '1', name: 'Voucher 100K', pointsRequired: 1000, membershipLevel: 'Silver' },
            { id: '2', name: 'Voucher 500K', pointsRequired: 5000, membershipLevel: 'Gold' },
          ].map((reward) => (
            <div key={reward.id} className="reward-item">
              <p>{reward.name} - {reward.pointsRequired} điểm</p>
              <p>Yêu cầu: {reward.membershipLevel}</p>
              <button
                className="btn btn-primary"
                disabled={
                  pointsData.points < reward.pointsRequired ||
                  membershipData.membershipLevel < reward.membershipLevel
                }
                onClick={() => handleRedeemPoints(reward.id, reward.pointsRequired)}
              >
                Đổi Ngay
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Membership;