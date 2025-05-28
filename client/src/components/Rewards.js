import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/rewards.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaGift, FaHistory, FaTicketAlt } from 'react-icons/fa';

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [membershipLevel, setMembershipLevel] = useState('');
  const [history, setHistory] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [showVouchers, setShowVouchers] = useState(false);

  // Lấy danh sách ưu đãi
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

  // Lấy lịch sử đổi thưởng
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

  // Lấy danh sách voucher đã đổi
  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')).token
        : null;
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/rewards/vouchers', config);
      setVouchers(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách voucher');
    }
  };

  // Xử lý đổi ưu đãi
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
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đổi ưu đãi');
    } finally {
      setRedeeming(null);
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchHistory();
    fetchVouchers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Tiêu đề */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold mb-8 text-center text-blue-900"
      >
        <FaGift className="inline-block mr-2 text-yellow-500" /> Ưu Đãi Thành Viên
      </motion.h1>

      {/* Thông tin người dùng */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="user-info bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl shadow-lg mb-10 text-center"
      >
        <p className="text-xl font-semibold text-gray-800">
          <FaStar className="inline-block mr-2 text-yellow-400" />
          Cấp độ thành viên: <span className="text-blue-600">{membershipLevel}</span>
        </p>
        <p className="text-xl font-semibold text-gray-800 mt-2">
          Điểm hiện có: <span className="text-green-600">{userPoints}</span>
        </p>
      <motion.button
  onClick={() => setShowVouchers(!showVouchers)}
  className="voucher-toggle-btn mt-4 px-5 py-3 bg-yellow-400 text-black rounded-full font-semibold shadow-md transition duration-300"
>
  <FaTicketAlt className="inline-block mr-2" />
  {showVouchers ? 'Ẩn Voucher' : 'Xem Voucher Đã Đổi'}
</motion.button>


      </motion.div>

      {/* Danh sách voucher đã đổi */}
      {showVouchers && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="voucher-table bg-white p-8 rounded-2xl shadow-lg mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            <FaTicketAlt className="inline-block mr-2 text-blue-600" /> Voucher Đã Đổi
          </h2>
          {vouchers.length === 0 ? (
            <p className="text-gray-600">Chưa có voucher nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-4 font-semibold text-gray-700">Mã Voucher</th>
                    <th className="p-4 font-semibold text-gray-700">Tên Ưu Đãi</th>
                    <th className="p-4 font-semibold text-gray-700">Ngày Hết Hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher) => (
                    <motion.tr
                      key={voucher._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="border-t hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="p-4">{voucher.voucherCode}</td>
                      <td className="p-4">{voucher.rewardId.name}</td>
                      <td className="p-4">{new Date(voucher.expiryDate).toLocaleDateString('vi-VN')}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Danh sách ưu đãi */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        {rewards.length === 0 ? (
          <p className="col-span-full text-center text-gray-600">Không có ưu đãi khả dụng</p>
        ) : (
          <AnimatePresence>
            {rewards.map((reward) => (
              <motion.div
                key={reward._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="reward-card bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-3">{reward.name}</h3>
                <p className="text-gray-600 mb-4">{reward.description}</p>
                <p className="text-sm text-gray-500 mb-2">
                  Cấp độ yêu cầu: <span className="font-medium text-blue-600">{reward.membershipLevel}</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Điểm yêu cầu: <span className="font-medium text-green-600">{reward.pointsRequired}</span>
                </p>
               <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => handleRedeem(reward._id)}
  disabled={redeeming === reward._id || userPoints < reward.pointsRequired}
  className={`redeem-btn w-full py-3 px-4 rounded-full font-semibold transition-all duration-300 ${
  redeeming === reward._id || userPoints < reward.pointsRequired
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`}
>
  {redeeming === reward._id ? 'Đang xử lý...' : '🎁 Đổi Ưu Đãi'}
</motion.button>

              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Lịch sử đổi thưởng */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="history-table bg-white p-8 rounded-2xl shadow-lg"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          <FaHistory className="inline-block mr-2 text-blue-600" /> Lịch sử đổi thưởng
        </h2>
        {history.length === 0 ? (
          <p className="text-gray-600">Chưa có giao dịch đổi thưởng nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 font-semibold text-gray-700">Ngày</th>
                  <th className="p-4 font-semibold text-gray-700">Mô tả</th>
                  <th className="p-4 font-semibold text-gray-700">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {history.map((transaction) => (
                  <motion.tr
                    key={transaction._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border-t hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="p-4">{new Date(transaction.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="p-4">{transaction.description}</td>
                    <td className="p-4 text-red-600 font-medium">{transaction.points}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Rewards;