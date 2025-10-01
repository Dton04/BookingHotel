import React, { useEffect, useState } from "react";
import AdminRengionImageUpload from "./AdminRegionImageUpload";

function AdminRegions() {
  const [regions, setRegions] = useState([]);
  const [newRegion, setNewRegion] = useState("");
  const [loading, setLoading] = useState(false);

  // Load regions
  const fetchRegions = async () => {
    try {
      const res = await fetch("/api/regions");
      const data = await res.json();
      setRegions(data);
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  // Tạo region mới
  const handleCreateRegion = async () => {
    if (!newRegion.trim()) {
      alert("Vui lòng nhập tên khu vực!");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRegion })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Tạo khu vực thành công!");
        setNewRegion("");
        fetchRegions();
      } else {
        alert(data.message || "Lỗi khi tạo khu vực");
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  // Callback khi upload ảnh
  const handleImageUploaded = (updatedRegion) => {
    setRegions(prev =>
      prev.map(r => r._id === updatedRegion._id ? updatedRegion : r)
    );
  };

  return (
    <div className="container my-4">
      <h2>Quản lý Khu vực</h2>

      {/* Form tạo region */}
      <div className="d-flex my-3">
        <input
          type="text"
          placeholder="Tên khu vực mới"
          value={newRegion}
          onChange={(e) => setNewRegion(e.target.value)}
          className="form-control me-2"
        />
        <button
          className="btn btn-primary"
          onClick={handleCreateRegion}
          disabled={loading}
        >
          {loading ? "Đang tạo..." : "Thêm Khu vực"}
        </button>
      </div>

      {/* Danh sách region */}
      <div className="row">
        {regions.map(region => (
          <div key={region._id} className="col-md-4 mb-4">
            <div className="card">
              <img
                src={region.imageUrl || "/images/placeholder.jpg"}
                alt={region.name}
                className="card-img-top"
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body">
                <h5 className="card-title">{region.name}</h5>
                <AdminRengionImageUpload
                  regionId={region._id}
                  onUploaded={handleImageUploaded}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminRegions;
