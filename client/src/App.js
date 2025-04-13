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
import About from './screens/About';
import Footer from './components/Footer';
import Registerscreen from './screens/Auth/Registerscreen';
import LoginScreen from './screens/Auth/Loginscreen';

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
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;