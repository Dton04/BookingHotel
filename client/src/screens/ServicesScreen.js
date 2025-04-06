import React from 'react';
import Banner from '../components/Banner';
import '../css/services.css';

function ServicesScreen() {
  const services = [
    {
      title: 'Rooms & Apartment',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo eos lorem sed diam stet diam sed stet lorem.',
      icon: '🏠',
    },
    {
      title: 'Food & Restaurant',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo eos lorem sed diam stet diam sed stet lorem.',
      icon: '🍽️',
    },
    {
      title: 'Spa & Fitness',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo eos lorem sed diam stet diam sed stet lorem.',
      icon: '🧘',
    },
    {
      title: 'Sports & Gaming',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo eos lorem sed diam stet diam sed stet lorem.',
      icon: '🏀',
    },
    {
      title: 'Event & Party',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo eos lorem sed diam stet diam sed stet lorem.',
      icon: '🎉',
    },
    {
      title: 'GYM & Yoga',
      description: 'Erat ipsum justo amet duo et elitr dolor, est duo eos lorem sed diam stet diam sed stet lorem.',
      icon: '🏋️',
    },
  ];

  return (
    <div className="services-page">
      {/* Banner */}
      <Banner />

      <div className="container">
        {/* Tiêu đề */}
        <div className="services-header text-center">
          <h2 className="subtitle">
            <span className="line"></span>
            OUR SERVICES
            <span className="line"></span>
          </h2>
          <h1 className="title">
            Explore Our <span>SERVICES</span>
          </h1>
        </div>

        {/* Danh sách dịch vụ */}
        <div className="row">
          {services.map((service, index) => (
            <div className="col-md-4 col-sm-6 mb-4" key={index}>
              <div className="service-box">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ServicesScreen;