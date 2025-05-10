import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

function ReviewChart({ roomId }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canViewChart, setCanViewChart] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  // Lấy thông tin người dùng để kiểm tra vai trò
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userInfo = localStorage.getItem("userInfo");
        console.log("userInfo from localStorage:", userInfo); // Debug userInfo
        if (!userInfo) {
          console.log("No userInfo found, setting canViewChart to false");
          setCanViewChart(false);
          setUserLoading(false);
          return;
        }

        const parsedUserInfo = JSON.parse(userInfo);
        const token = parsedUserInfo.token;
        console.log("Token from userInfo:", token); // Debug token
        if (!token) {
          console.log("No token found in userInfo, setting canViewChart to false");
          setCanViewChart(false);
          setUserLoading(false);
          return;
        }

        const response = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("User data from API:", response.data); // Debug user data
        const user = response.data;
        // Kiểm tra vai trò: admin (isAdmin: true) hoặc staff (role: 'staff')
        setCanViewChart(user.isAdmin === true || user.role === "staff");
      } catch (error) {
        console.error("Error fetching user profile:", error.response?.status, error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem("userInfo"); // Xóa userInfo nếu token hết hạn
          console.log("Token expired or invalid, removed userInfo");
        }
        setCanViewChart(false);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Lấy dữ liệu đánh giá nếu có quyền
  useEffect(() => {
    const fetchReviews = async () => {
      if (!roomId || !canViewChart) return; // Không fetch nếu không có quyền
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/api/reviews", { params: { roomId } });
        const reviews = response.data;

        // Tính số lượng đánh giá theo từng mức sao
        const ratingCounts = Array(5).fill(0);
        reviews.forEach((review) => {
          if (review.rating >= 1 && review.rating <= 5) {
            ratingCounts[review.rating - 1]++;
          }
        });

        // Chuẩn bị dữ liệu cho biểu đồ
        const data = ratingCounts.map((count, index) => ({
          name: `${index + 1} sao`,
          count,
        }));
        setChartData(data);
      } catch (error) {
        setError("Không thể tải dữ liệu đánh giá.");
        console.error("Error fetching reviews for chart:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!userLoading) {
      fetchReviews();
    }
  }, [roomId, canViewChart, userLoading]);

  // Nếu đang tải thông tin người dùng, hiển thị loader
  if (userLoading) {
    return <p>Đang tải...</p>;
  }

  // Nếu không phải admin hoặc staff, không hiển thị gì
  if (!canViewChart) {
    return <p>Bạn không có quyền xem biểu đồ này.</p>;
  }

  return (
    <div className="review-chart">
      <h5>Biểu đồ đánh giá</h5>
      {loading ? (
        <p>Đang tải biểu đồ...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : chartData.length > 0 ? (
        <BarChart width={400} height={300} data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      ) : (
        <p>Chưa có đánh giá nào để hiển thị.</p>
      )}
    </div>
  );
}

export default ReviewChart;