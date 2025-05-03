import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Alert, Spinner, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import '../css/dashboard.css';

// Đăng ký các thành phần cần thiết cho Chart.js, bao gồm datalabels
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalReviews: 0,
    totalRevenue: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState({});
  const [monthlyRevenue, setMonthlyRevenue] = useState({});
  const [dailyFilter, setDailyFilter] = useState('7days');
  const [monthlyFilter, setMonthlyFilter] = useState('6months');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dailyChartRef = useRef(null);
  const monthlyChartRef = useRef(null);
  const overviewChartRef = useRef(null);

  useEffect(() => {
    // Kiểm tra vai trò admin hoặc staff
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !['admin', 'staff'].includes(userInfo.role)) {
      navigate('/home');
      return;
    }

    // Lấy dữ liệu thống kê
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewResponse, dailyResponse, monthlyResponse] = await Promise.all([
          axios.get('/api/dashboard/overview'),
          axios.get('/api/bookings/stats/daily'),
          axios.get('/api/bookings/stats/monthly'),
        ]);
        setStats(overviewResponse.data);
        setDailyRevenue(dailyResponse.data);
        setMonthlyRevenue(monthlyResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu thống kê.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Xử lý dữ liệu cho biểu đồ doanh thu theo ngày
  const getFilteredDailyData = () => {
    const daysLimit = dailyFilter === '7days' ? 7 : 30;
    const today = new Date();
    const filteredDates = Object.keys(dailyRevenue)
      .filter(date => {
        const recordDate = new Date(date);
        const diffDays = (today - recordDate) / (1000 * 60 * 60 * 24);
        return diffDays <= daysLimit;
      })
      .sort((a, b) => new Date(a) - new Date(b));

    return {
      labels: filteredDates.map(date => date),
      datasets: [
        {
          label: 'Doanh thu theo ngày (triệu VNĐ)',
          data: filteredDates.map(date => dailyRevenue[date] / 1000000),
          backgroundColor: 'rgba(245, 166, 35, 0.8)',
          borderColor: 'rgba(245, 166, 35, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Xử lý dữ liệu cho biểu đồ doanh thu theo tháng
  const getFilteredMonthlyData = () => {
    const monthsLimit = monthlyFilter === '6months' ? 6 : 12;
    const today = new Date();
    const filteredMonths = Object.keys(monthlyRevenue)
      .filter(month => {
        const [year, monthNum] = month.split('-').map(Number);
        const recordDate = new Date(year, monthNum - 1);
        const diffMonths = (today.getFullYear() - year) * 12 + today.getMonth() - (monthNum - 1);
        return diffMonths <= monthsLimit;
      })
      .sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
      });

    return {
      labels: filteredMonths.map(month => month),
      datasets: [
        {
          label: 'Doanh thu theo tháng (triệu VNĐ)',
          data: filteredMonths.map(month => monthlyRevenue[month] / 1000000),
          backgroundColor: 'rgba(245, 166, 35, 0.8)',
          borderColor: 'rgba(245, 166, 35, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Inter, sans-serif', size: 14 },
          color: '#2d3748',
        },
      },
      title: {
        display: true,
        text: 'Thống kê doanh thu',
        font: { family: 'Inter, sans-serif', size: 18, weight: 'bold' },
        color: '#2d3748',
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: (value) => `${value.toLocaleString('vi-VN')} triệu`,
        color: '#2d3748',
        font: {
          family: 'Inter, sans-serif',
          weight: 'bold',
          size: 12,
        },
      },
      tooltip: {
        backgroundColor: '#2d3748',
        titleFont: { family: 'Inter, sans-serif', size: 14 },
        bodyFont: { family: 'Inter, sans-serif', size: 12 },
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw.toLocaleString('vi-VN')} triệu VNĐ`,
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { family: 'Inter, sans-serif', size: 12 }, color: '#4a5568' },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { font: { family: 'Inter, sans-serif', size: 12 }, color: '#4a5568' },
        title: {
          display: true,
          text: 'Doanh thu (triệu VNĐ)',
          font: { family: 'Inter, sans-serif', size: 14, weight: 'bold' },
          color: '#2d3748',
        },
        grid: { color: '#e2e8f0' },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  const overviewChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Inter, sans-serif', size: 14 },
          color: '#2d3748',
        },
      },
      title: {
        display: true,
        text: 'Tổng quan hệ thống',
        font: { family: 'Inter, sans-serif', size: 18, weight: 'bold' },
        color: '#2d3748',
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: (value, context) => {
          if (context.dataIndex === 2) {
            return `${value.toLocaleString('vi-VN')} triệu`;
          }
          return value.toLocaleString('vi-VN');
        },
        color: '#2d3748',
        font: {
          family: 'Inter, sans-serif',
          weight: 'bold',
          size: 12,
        },
      },
      tooltip: {
        backgroundColor: '#2d3748',
        titleFont: { family: 'Inter, sans-serif', size: 14 },
        bodyFont: { family: 'Inter, sans-serif', size: 12 },
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            if (context.dataIndex === 2) {
              return `${label}: ${value.toLocaleString('vi-VN')} triệu VNĐ`;
            }
            return `${label}: ${value.toLocaleString('vi-VN')}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { font: { family: 'Inter, sans-serif', size: 12 }, color: '#4a5568' },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { font: { family: 'Inter, sans-serif', size: 12 }, color: '#4a5568' },
        title: {
          display: true,
          text: 'Giá trị',
          font: { family: 'Inter, sans-serif', size: 14, weight: 'bold' },
          color: '#2d3748',
        },
        grid: { color: '#e2e8f0' },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  // Dữ liệu cho biểu đồ tổng quan
  const overviewChartData = {
    labels: ['Đặt phòng', 'Đánh giá', 'Doanh thu'],
    datasets: [
      {
        label: 'Thống kê tổng quan',
        data: [stats.totalBookings, stats.totalReviews, stats.totalRevenue / 1000000],
        backgroundColor: ['rgba(245, 166, 35, 0.8)', 'rgba(108, 117, 125, 0.8)', 'rgba(245, 166, 35, 0.8)'],
        borderColor: ['rgba(245, 166, 35, 1)', 'rgba(108, 117, 125, 1)', 'rgba(245, 166, 35, 1)'],
        borderWidth: 1,
      },
    ],
  };

  // Hàm tải biểu đồ
  const downloadChart = (chartRef, filename) => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.href = chartRef.current.toBase64Image();
      link.download = filename;
      link.click();
    }
  };

  return (
    <div className="dashboard-page">
      <Container>
        <div className="dashboard-header text-center">
          <h2 className="subtitle">
            <span className="line"></span>
            BẢNG ĐIỀU KHIỂN
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Tổng quan <span>QUẢN TRỊ</span>
          </h1>
        </div>

        {loading ? (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center modern-alert">
            {error}
          </Alert>
        ) : (
          <>
            <Row className="mb-5">
              <Col md={4} sm={12} className="mb-4">
                <Card className="stat-card modern-card">
                  <Card.Body>
                    <Card.Title className="modern-title">
                      <i className="fas fa-book me-2"></i> Tổng số đặt phòng
                    </Card.Title>
                    <Card.Text className="stat-value">{stats.totalBookings}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} sm={12} className="mb-4">
                <Card className="stat-card modern-card">
                  <Card.Body>
                    <Card.Title className="modern-title">
                      <i className="fas fa-star me-2"></i> Tổng số đánh giá
                    </Card.Title>
                    <Card.Text className="stat-value">{stats.totalReviews}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} sm={12} className="mb-4">
                <Card className="stat-card modern-card">
                  <Card.Body>
                    <Card.Title className="modern-title">
                      <i className="fas fa-dollar-sign me-2"></i> Tổng doanh thu
                    </Card.Title>
                    <Card.Text className="stat-value">
                      {(stats.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="mb-5">
              <Col md={12}>
                <Card className="chart-card modern-card">
                  <Card.Body>
                    <div className="chart-filter mb-4">
                      <Form.Group as={Row} className="align-items-center">
                        <Col xs="auto">
                          <Button
                            variant="outline-primary"
                            className="modern-button"
                            onClick={() => downloadChart(overviewChartRef, 'overview_chart.png')}
                          >
                            <i className="fas fa-download me-2"></i> Tải biểu đồ
                          </Button>
                        </Col>
                      </Form.Group>
                    </div>
                    <Bar
                      ref={overviewChartRef}
                      data={overviewChartData}
                      options={overviewChartOptions}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="mb-5">
              <Col md={12}>
                <Card className="chart-card modern-card">
                  <Card.Body>
                    <div className="chart-filter mb-4">
                      <Form.Group as={Row} className="align-items-center">
                        <Col xs="auto">
                          <Form.Label className="modern-label">Chọn khoảng thời gian:</Form.Label>
                        </Col>
                        <Col xs="auto">
                          <Form.Select
                            value={dailyFilter}
                            onChange={(e) => setDailyFilter(e.target.value)}
                            className="modern-select"
                          >
                            <option value="7days">7 ngày gần nhất</option>
                            <option value="30days">30 ngày gần nhất</option>
                          </Form.Select>
                        </Col>
                        <Col xs="auto">
                          <Button
                            variant="outline-primary"
                            className="modern-button"
                            onClick={() => downloadChart(dailyChartRef, 'daily_revenue.png')}
                          >
                            <i className="fas fa-download me-2"></i> Tải biểu đồ
                          </Button>
                        </Col>
                      </Form.Group>
                    </div>
                    <Bar
                      ref={dailyChartRef}
                      data={getFilteredDailyData()}
                      options={{
                        ...revenueChartOptions,
                        plugins: {
                          ...revenueChartOptions.plugins,
                          title: { display: true, text: 'Doanh thu theo ngày' },
                        },
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row>
              <Col md={12}>
                <Card className="chart-card modern-card">
                  <Card.Body>
                    <div className="chart-filter mb-4">
                      <Form.Group as={Row} className="align-items-center">
                        <Col xs="auto">
                          <Form.Label className="modern-label">Chọn khoảng thời gian:</Form.Label>
                        </Col>
                        <Col xs="auto">
                          <Form.Select
                            value={monthlyFilter}
                            onChange={(e) => setMonthlyFilter(e.target.value)}
                            className="modern-select"
                          >
                            <option value="6months">6 tháng gần nhất</option>
                            <option value="12months">12 tháng gần nhất</option>
                          </Form.Select>
                        </Col>
                        <Col xs="auto">
                          <Button
                            variant="outline-primary"
                            className="modern-button"
                            onClick={() => downloadChart(monthlyChartRef, 'monthly_revenue.png')}
                          >
                            <i className="fas fa-download me-2"></i> Tải biểu đồ
                          </Button>
                        </Col>
                      </Form.Group>
                    </div>
                    <Bar
                      ref={monthlyChartRef}
                      data={getFilteredMonthlyData()}
                      options={{
                        ...revenueChartOptions,
                        plugins: {
                          ...revenueChartOptions.plugins,
                          title: { display: true, text: 'Doanh thu theo tháng' },
                        },
                      }}
                    />
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
}

export default AdminDashboard;