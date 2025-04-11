import React from 'react';
import './../css/booking-form.css';
function BookingForm() {
  return (
    <section className="booking-form">
      <form>
        <input type="date" placeholder="Check in" />
        <input type="date" placeholder="Check out" />
        <select defaultValue="Adult">
          <option disabled>Adult</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
        <select defaultValue="Child">
          <option disabled>Child</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
        </select>
        <button type="submit">SUBMIT</button>
      </form>
    </section>
  );
}

export default BookingForm;