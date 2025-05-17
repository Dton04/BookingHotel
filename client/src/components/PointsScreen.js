import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import AlertMessage from "../components/AlertMessage";

function PointsScreen() {
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Vui lòng đăng nhập để xem điểm tích lũy");
          setLoading(false);
          navigate("/login");
          return;
        }

        const response = await axios.get("/api/users/points", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Đảm bảo points là số hợp lệ
        setPoints(Number(response.data.points) || 0);
        // Đảm bảo recentTransactions là mảng
        setTransactions(Array.isArray(response.data.recentTransactions) ? response.data.recentTransactions : []);
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi tải điểm tích lũy");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [navigate]);

  return (
    <div className="container mt-4">
      <h2 className="mb-3">💎 Điểm Tích Lũy</h2>
      {loading && <Loader />}
      {error && <AlertMessage type="danger" message={error} />}
      {!loading && !error && (
        <>
          <div className="card p-3 mb-4 shadow-sm">
            <h4 className="text-success">Tổng điểm: {points.toLocaleString()} điểm</h4>
          </div>

          <h5 className="mb-3">🧾 Lịch sử giao dịch gần đây</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Ngày</th>
                  <th>Điểm</th>
                  <th>Số tiền</th>
                  <th>Checkin</th>
                  <th>Checkout</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">Không có giao dịch</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id || Math.random()}>
                      <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A"}</td>
                      <td>{tx.pointsEarned ?? "0"}</td>
                      <td>{tx.amount ? Number(tx.amount).toLocaleString() : "0"} VND</td>
                      <td>{tx.bookingId?.checkin ? new Date(tx.bookingId.checkin).toLocaleDateString() : "N/A"}</td>
                      <td>{tx.bookingId?.checkout ? new Date(tx.bookingId.checkout).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default PointsScreen;