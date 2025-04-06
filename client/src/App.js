import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Homescreen from './screens/Homescreen';
import Rooms from './components/Rooms';
import Bookingscreen from './screens/Bookingscreen';
import ServicesScreen from './screens/ServicesScreen';
import OurTeam from './components/Pages/OurTeam';
import Testimonial from './components/Pages/Testimonial';
import Contact from './components/Contact';

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/home" element={<Homescreen />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/services" element={<ServicesScreen />} />
          <Route path="/book/:roomid" element={<Bookingscreen />} />
          <Route path="/book" element={<Bookingscreen />} />
          <Route path="/ourteam" element={<OurTeam />} />
          <Route path="/testimonial" element={<Testimonial />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/" element={<Homescreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;