import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/discounts-page.css";
import Banner from "../components/Banner";
import { useNavigate } from "react-router-dom";

function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collected, setCollected] = useState([]);
  const [filter, setFilter] = useState("all"); // all | voucher | limited
  const navigate = useNavigate()
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/discounts");
        setDiscounts(data);

        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo) {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          const res = await axios.get("/api/discounts/my-vouchers", config);
          setCollected(res.data.map((v) => v.voucherCode));
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

    const handleFestivalClick = (id) => {
    navigate(`/festival-hotels/${id}`);
  };

  const handleCollect = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo) {
        alert("Vui lòng đăng nhập để thu thập mã");
        return;
      }
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const res = await axios.post(`/api/discounts/collect/${id}`, {}, config);
      setCollected([...collected, res.data.voucher.voucherCode]);
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi thu thập mã");
    }
  };

  // Filter discounts theo lựa chọn
  const filteredDiscounts = discounts.filter((d) => {
    if (filter === "voucher") return d.type === "voucher";
    if (filter === "limited") return d.type !== "voucher"; // gom hết loại khác
    return true; // all
  });


  return (
    <div className="discounts-page">
      <Banner />
  

      {/* Bộ lọc */}
      <div className="discounts-filter mb-3">
        <button
          className={`btn ${filter === "all" ? "btn-dark" : "btn-outline-dark"} me-2`}
          onClick={() => setFilter("all")}
        >
          Tất cả
        </button>
        <button
          className={`btn ${filter === "voucher" ? "btn-dark" : "btn-outline-dark"} me-2`}
          onClick={() => setFilter("voucher")}
        >
          Phiếu giảm giá
        </button>
        <button
          className={`btn ${filter === "limited" ? "btn-dark" : "btn-outline-dark"}`}
          onClick={() => setFilter("limited")}
        >
          Khuyến mãi có thời hạn
        </button>
      </div>

      {/* Danh sách */}
      {/* Danh sách */}
<div className="discounts-grid">
      {filteredDiscounts.map((d) => (
        <div key={d._id} className="discount-card">
          <div className="discount-image">
            <img src={d.image || "/default-discount.jpg"} alt={d.name} />
            <span className="discount-badge">
              {d.discountType === "percentage"
                ? `-${d.discountValue}%`
                : `-${d.discountValue.toLocaleString()} VND`}
            </span>
          </div>
          <div className="discount-content">
            <h5 className="discount-title">{d.name}</h5>
            <p className="discount-desc">{d.description}</p>

            {d.type === "voucher" ? (
              <button
                className={`btn-discount ${
                  collected.includes(d.code) ? "btn-collected" : "btn-collect"
                }`}
                disabled={collected.includes(d.code)}
                onClick={() => handleCollect(d._id)}
              >
                {collected.includes(d.code) ? "Đã thu thập" : "Nhận phiếu giảm giá"}
              </button>
            ) : d.type === "festival" ? (
              <button
                className="btn-discount btn-festival"
                onClick={() => handleFestivalClick(d._id)}
              >
                Xem khách sạn ưu đãi
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>

    </div>
  );
}

export default DiscountsPage;
