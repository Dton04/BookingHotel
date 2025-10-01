

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Slider from 'react-slick';
import '../css/banner.css';

function Banner() {
  const location = useLocation();

  // Cấu hình cho slider
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    arrows: true,
  };

  // Dữ liệu cho slider trên trang chủ
  const slides = [
    {
      image: 'https://images.ctfassets.net/ltric1hkjv72/1u9ZGbnmRiPLywGUIeKcga/be983bfbe9d0344e97c5c86520e24948/Best-Views-Wake-Up-To_Hero_Retouched.jpg',
      subtitle: 'LUXURY LIVING',
      title: 'Discover A Brand Luxurious Hotel',
    },
    {
      image: 'https://www.thehotelguru.com/_images/48/e8/48e8b317bb1f5cbe1cbcfb12f56daf31/600x422.jpg',
      subtitle: 'EXCLUSIVE OFFERS',
      title: 'Experience The Best Hospitality',
    },
  ];

  // Logic hiển thị nội dung dựa trên pathname
  const getPageContent = () => {
    switch (location.pathname) {
      case '/home':
      case '/':
        return {
          isSlider: true, // Dùng slider cho trang chủ
          slides: slides,
          buttons: (
            <div className="banner-buttons">
              <Link to="/rooms" className="btn btn-primary">OUR ROOMS</Link>
              <Link to="/book" className="btn btn-secondary">BOOK A ROOM</Link>
            </div>
          ),
        };
      case '/rooms':
        return {
          isSlider: false,
          title: 'Rooms',
          breadcrumb: 'HOME / PAGES / ROOMS',
          buttons: null,
          image: 'https://res.cloudinary.com/dah1butg2/image/upload/v1743929403/pexels-pixabay-260922_smnq5l.jpg',
        };
    
      case '/about':
        return {
          isSlider: false,
          title: 'About',
          breadcrumb: 'HOME / PAGES / ABOUT',
          buttons: null,
          image: 'https://hips.hearstapps.com/hmg-prod/images/grand-hotel-tremezzo-6479210d9dae0.jpeg',
        };
      case '/ourteam':
        return {
          isSlider: false,
          title: 'Ourteam',
          breadcrumb: 'HOME / PAGES / OURTEAM',
          buttons: null,
          image: 'https://res.cloudinary.com/dah1butg2/image/upload/v1743929403/pexels-pixabay-260922_smnq5l.jpg',
        };
      case '/contact':
        return {
          isSlider: false,
          title: 'Contact',
          breadcrumb: 'HOME / PAGES / CONTACT',
          buttons: null,
          image: 'https://media.istockphoto.com/id/520542221/photo/hotel-reception-with-bell.jpg?s=612x612&w=0&k=20&c=quMdykg6OVTzGnANco9OVbVIxdRChamN3-iTbEe7os0=',
        };
       case '/admin/bookings':
        return {
          isSlider: false,
          title: 'QUẢN LÝ ĐẶT PHÒNG',
          breadcrumb: 'HOME / ADMIN / BOOKING',
          buttons: null,
          image: 'https://res.cloudinary.com/dah1butg2/image/upload/v1743929403/pexels-pixabay-260922_smnq5l.jpg',
        };
      default:
        return {
          isSlider: false,
          title: '',
          breadcrumb: '',
          buttons: null,
          image: 'https://res.cloudinary.com/dah1butg2/image/upload/v1743929403/pexels-pixabay-260922_smnq5l.jpg',
        };
    }
  };

  const { isSlider, slides: slideData, title, breadcrumb, buttons, image } = getPageContent();

  return (
    <section className="banner">
      {isSlider ? (
        <Slider {...settings}>
          {slideData.map((slide, index) => (
            <div key={index} className="banner-slide">
              <div
                className="banner-image"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="banner-overlay">
                  <div className="banner-content">
                    <h2 className="banner-subtitle animate">{slide.subtitle}</h2>
                    <h1 className="banner-title animate">{slide.title}</h1>
                    <div className="banner-buttons animate">{buttons}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      ) : (
        <div
          className="banner-image"
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="banner-overlay">
            <div className="banner-content">
              <h1 className="banner-title animate">{title}</h1>
              {breadcrumb && <p className="banner-breadcrumb animate">{breadcrumb}</p>}
              {buttons}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Banner;