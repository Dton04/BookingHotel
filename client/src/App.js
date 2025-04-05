import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Homescreen from './screens/Homescreen';
import Rooms from './components/Rooms';
import Bookingscreen from './screens/Bookingscreen';

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/home" element={<Homescreen />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/book/:roomid" element={<Bookingscreen />} />
          <Route path="/" element={<Homescreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;