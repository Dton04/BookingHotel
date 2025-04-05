import React from 'react';

function ServicesContent() {
  return (
    <section className="services-content">
      <h2>OUR SERVICES</h2>
      <h1>Explore Our <span>SERVICES</span></h1>
      <div className="services-grid">
        <div className="service-item">
          <i className="fas fa-shopping-bag"></i>
        </div>
        <div className="service-item">
          <i className="fas fa-utensils"></i>
        </div>
        <div className="service-item">
          <i className="fas fa-leaf"></i>
        </div>
      </div>
    </section>
  );
}

export default ServicesContent;