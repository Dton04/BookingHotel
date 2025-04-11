import React from 'react';
import Banner from './Banner';
import BookingForm from './BookingForm';
import Bookingscreen from '../screens/Bookingscreen';
import './../css/bookingscreen.css';

function Rooms() {
  return (
    <div>
      <Banner />
      <BookingForm />
      <Bookingscreen />
    </div>
  );
}

export default Rooms;