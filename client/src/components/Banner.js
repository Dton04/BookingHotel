import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Banner() {
  const location = useLocation();
  const getPageContent = () => {
    switch (location.pathname) {
      case '/home':
      case '/':
        return {
          title: 'DISCOVER A BRAND LUXURIOUS HOTEL',
          breadcrumb: '',
          buttons: (
            <div className="banner-buttons">
              <Link to="/rooms" className="btn btn-primary">OUR ROOMS</Link>
              <Link to="/book" className="btn btn-secondary">BOOK A ROOM</Link>
            </div>
          ),
        };
      case '/rooms':
        return { title: 'Rooms', breadcrumb: 'HOME / PAGES / ROOMS', buttons: null };
      case '/services':
        return { title: 'Services', breadcrumb: 'HOME / PAGES / SERVICES', buttons: null };
      default:
        return { title: '', breadcrumb: '', buttons: null };
    }
  };

  const { title, breadcrumb, buttons } = getPageContent();

  return (
    <section className="banner" style={{ backgroundImage: 'url("https://res.cloudinary.com/dah1butg2/image/upload/v1743929403/pexels-pixabay-260922_smnq5l.jpg")' }}>
      <div className="banner-content">
        <h1>{title}</h1>
        {breadcrumb && <p>{breadcrumb}</p>}
        {buttons}
      </div>
    </section>
  );
}

export default Banner;