import React from 'react';
import Banner from './Banner';
import BookingForm from './BookingForm';
import RoomsContent from './RoomsContent';
import '../css/rooms.css';

function Rooms() {
  return (
    <div className="room-page">
      <Banner />    
      <BookingForm />
      <RoomsContent />
    </div>

  );
}

export default Rooms;