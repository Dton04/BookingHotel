import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/rewards.css';

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [membershipLevel, setMembershipLevel] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).token
        : null;
      if (!token) throw new Error('Vui lòng đăng nhập để xem ưu đãi');

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/rewards', config);
      setRewards(data.rewards);
      setUserPoints(data.userPoints);
      setMembershipLevel(data.membershipLevel);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải ưu đãi');
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).token
        : null;
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/rewards/history', config);
      setHistory(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải lịch sử đổi thưởng');
    }
  };

  const handleRedeem = async (rewardId) => {
    setRedeeming(rewardId);
    try {
      const token = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).token
        : null;
      if (!token) throw new Error('Vui lòng đăng nhập để đổi ưu đãi');

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post('/api/rewards/redeem', { rewardId }, config);
      toast.success(`Đổi ưu đãi thành công! Mã: ${data.voucherCode}`);
      setUserPoints(data.remainingPoints);
      fetchRewards();
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đổi ưu đãi');
    } finally {
      setRedeeming(null);
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Ưu đãi thành viên</h1>

      <div className="bg-gray-100 p-6 rounded-lg mb-8 text-center user-info">
        <p className="text-lg">Cấp độ thành viên: <span className="font-semibold">{membershipLevel}</span></p>
        <p className="text-lg">Điểm hiện có: <span className="font-semibold">{userPoints}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {rewards.length === 0 ? (
          <p className="text-center col-span-full">Không có ưu đãi khả dụng</p>
        ) : (
          rewards.map((reward) => (
            <div key={reward._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition reward-card">
              <h3 className="text-xl font-semibold mb-2">{reward.name}</h3>
              <p className="text-gray-600 mb-4">{reward.description}</p>
              <p className="text-sm mb-2">Cấp độ yêu cầu: <span className="font-medium">{reward.membershipLevel}</span></p>
              <p className="text-sm mb-4">Điểm yêu cầu: <span className="font-medium">{reward.pointsRequired}</span></p>
              <button
                onClick={() => handleRedeem(reward._id)}
                disabled={redeeming === reward._id}
                className={`w-full py-2 rounded-lg text-white ${redeeming === reward._id ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {redeeming === reward._id ? 'Đang xử lý...' : 'Đổi ưu đãi'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md history-table">
        <h2 className="text-2xl font-semibold mb-4">Lịch sử đổi thưởng</h2>
        {history.length === 0 ? (
          <p>Chưa có giao dịch đổi thưởng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3">Ngày</th>
                  <th className="p-3">Mô tả</th>
                  <th className="p-3">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {history.map((transaction) => (
                  <tr key={transaction._id} className="border-t">
                    <td className="p-3">{new Date(transaction.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3">{transaction.description}</td>
                    <td className="p-3 text-red-600">{transaction.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;