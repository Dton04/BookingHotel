import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

function ReviewChart({ roomId }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!roomId) return;
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

    fetchReviews();
  }, [roomId]);

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