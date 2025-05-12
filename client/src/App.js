import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Homescreen from './screens/Homescreen';
import Rooms from './components/Rooms';
import Bookingscreen from './screens/Bookingscreen';
import ServicesScreen from './screens/ServicesScreen';
import OurTeam from './components/Pages/OurTeam';
import Testimonial from './components/Pages/Testimonial';
import Contact from './components/Contact';
import About from './screens/About';
import Footer from './components/Footer';
import Registerscreen from './screens/Auth/Registerscreen';
import LoginScreen from './screens/Auth/Loginscreen';
import StaffManagement from './components/StaffManagement';
import UserManagement from './components/UserManagement';
import HistoryBookings from './components/HistoryBookings';
import UserStats from './components/UserStats';
import AdminBookings from './components/AdminBookings';
import BookingList from './components/BookingList';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import CreateRoomForm from './components/CreateRoomForm';
import RoomManagement from './components/RoomManagement';
import EditRoomForm from './components/EditRoomForm';
import ProfileManagement from './components/ProfileManagement'; 
import GoogleCallBack from './screens/Auth/GoogleCallBack';

import Membership from './components/Membership';
import AdminDiscounts from './components/AdminDiscounts';
// Component bảo vệ route cho admin
const AdminRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return userInfo && userInfo.isAdmin ? children : <Navigate to="/" replace />;
};

// Component bảo vệ route cho admin và staff
const ProtectedRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return userInfo && (userInfo.role === 'admin' || userInfo.role === 'staff') ? children : <Navigate to="/" replace />;
};

// Component bảo vệ route cho người dùng đã đăng nhập
const UserRoute = ({ children }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
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
          <Route path="/book/:roomid" element={<Bookingscreen />} />
          <Route path="/book" element={<Bookingscreen />} />
          <Route path="/ourteam" element={<OurTeam />} />
          <Route path="/testimonial" element={<Testimonial />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/" element={<Homescreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<Registerscreen />} />
          <Route path="/bookings" element={<HistoryBookings />} />
          <Route path="/auth/google/callback" element={<GoogleCallBack />} />
          <Route path="/stats" element={<UserStats/>} />
          <Route path="/bookings" element={<BookingList />} />
          <Route path="/rooms" element={<BookingForm />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/createroom" element={<CreateRoomForm />} />
          <Route path="/admin/rooms" element={<RoomManagement />} />
          <Route path="/admin/editroom/:id" element={<EditRoomForm />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/admin/discounts" element={<AdminDiscounts />} />        


          {/* Route cho StaffManagement, chỉ admin truy cập được */}
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
          {/* Route cho UserManagement, cả admin và staff truy cập được */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          {/* Route cho ProfileManagement, chỉ người dùng đã đăng nhập truy cập được */}
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