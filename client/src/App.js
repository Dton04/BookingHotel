import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Homescreen from "./screens/Homescreen";
import Rooms from "./components/Rooms";
import Bookingscreen from "./screens/Bookingscreen";
import ServicesScreen from "./screens/ServicesScreen";
import OurTeam from "./components/Pages/OurTeam";
import Testimonial from "./components/Pages/Testimonial";
import Contact from "./components/Contact";
import About from "./screens/About";
import Footer from "./components/Footer";
import Registerscreen from "./screens/Auth/Registerscreen";
import LoginScreen from "./screens/Auth/Loginscreen";
import StaffManagement from "./components/StaffManagement";
import UserManagement from "./components/UserManagement";
import HistoryBookings from "./components/HistoryBookings";
import UserStats from "./components/UserStats";
import AdminBookings from "./components/AdminBookings";
import BookingList from "./components/BookingList";
import BookingForm from "./components/BookingForm";
import AdminDashboard from "./components/AdminDashboard";
import CreateRoomForm from "./components/CreateRoomForm";
import EditRoomForm from "./components/EditRoomForm";
import ProfileManagement from "./components/ProfileManagement";
import GoogleCallBack from "./screens/Auth/GoogleCallBack";
import FacebookCallBack from "./screens/Auth/FacebookCallBack";
import Membership from "./components/Membership";
import AdminDiscounts from "./components/AdminDiscounts";
import RoomResults from "./components/RoomResults";
import HotelManagement from "./components/HotelManagement";
import HotelRoomManagement from "./components/HotelRoomManagement";
import Rewards from "./components/Rewards";
import VNPaySuccess from "./components/VNPaySuccess";


import PointsPage from './components/PointsPage';
import ReviewManagement from './components/ReviewManagement';
import Favorites from './components/Favorites';
import AdminRewards from "./components/AdminRewards";


// Component bảo vệ route cho admin
const AdminRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  return userInfo && userInfo.isAdmin ? children : <Navigate to="/" replace />;
};

// Component bảo vệ route cho admin và nhân viên
const ProtectedRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  return userInfo && (userInfo.role === "admin" || userInfo.role === "staff") ? children : <Navigate to="/" replace />;
};

// Component bảo vệ route cho người dùng đã đăng nhập
const UserRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  return userInfo ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/home" element={<Homescreen />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<ServicesScreen />} />
          <Route path="/room-results" element={<RoomResults />} />
          <Route path="/book-room/:roomId" element={<Bookingscreen />} />
          <Route path="/book/:roomid" element={<Bookingscreen />} />
          <Route path="/ourteam" element={<OurTeam />} />
          <Route path="/testimonial" element={<Testimonial />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/" element={<Homescreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<Registerscreen />} />
          <Route path="/bookings" element={<UserRoute><HistoryBookings /></UserRoute>} />
          <Route path="/auth/google/callback" element={<GoogleCallBack />} />
          <Route path="/auth/facebook/callback" element={<FacebookCallBack />} />
          <Route path="/stats" element={<UserRoute><UserStats /></UserRoute>} />
          <Route path="/booking-list" element={<UserRoute><BookingList /></UserRoute>} />
          <Route path="/booking-form" element={<BookingForm />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/createroom" element={<AdminRoute><CreateRoomForm /></AdminRoute>} />
          <Route path="/admin/editroom/:id" element={<AdminRoute><EditRoomForm /></AdminRoute>} />
          <Route path="/membership" element={<UserRoute><Membership /></UserRoute>} />
          <Route path="/admin/discounts" element={<AdminRoute><AdminDiscounts /></AdminRoute>} />
          <Route path="/admin/hotels" element={<AdminRoute><HotelManagement /></AdminRoute>} />
          <Route path="/admin/hotel/:hotelId/rooms" element={<AdminRoute><HotelRoomManagement /></AdminRoute>} />
          <Route path="/rewards" element={<UserRoute><Rewards /></UserRoute>} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/admin/reviews" element={<ReviewManagement />} />
          <Route path="/favorites" element={<Favorites />} />

          <Route path="/booking-success" element={<VNPaySuccess />} />
          <Route path="/admin/rewards" element={<AdminRewards />} />
        

          
          <Route
            path="/admin/staffmanagement"
            element={
              <AdminRoute>
                <StaffManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <AdminBookings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <UserRoute>
                <ProfileManagement />
              </UserRoute>
            }
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;