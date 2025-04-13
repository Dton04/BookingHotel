import React from 'react';
import { Link } from 'react-router-dom'; // Import Link từ react-router-dom
import '../css/Footer.css'; // Import CSS cho Footer

const FooterSection = ({ title, children, className }) => (
  <div className={`footer-section ${className}`}>
    {title && <h3>{title}</h3>}
    {children}
  </div>
);

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <FooterSection className="brand">
          <h2>HOTELIER</h2>
          <p>
            Hotelier - Premium Version, built by professional website for your hotel business and grab the attention of new visitors upon your site's launch.
          </p>
        </FooterSection>

        {/* Contact Section */}
        <FooterSection title="CONTACT">
          <p><span className="icon">📍</span> 123 Street, Thu Duc, HCM</p>
          <p><span className="icon">📞</span> +012 345 67890</p>
          <p><span className="icon">✉️</span> info@example.com</p>
         
        </FooterSection>

        {/* Company Section */}
        <FooterSection title="COMPANY">
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Condition</Link></li>
            <li><Link to="/support">Support</Link></li>
          </ul>
        </FooterSection>

        {/* Services Section */}
        <FooterSection title="SERVICES">
          <ul>
            <li><Link to="/services">Food & Restaurant</Link></li>
            <li><Link to="/services">Spa & Fitness</Link></li>
            <li><Link to="/services">Sports & Gaming</Link></li>
            <li><Link to="/services">Event & Party</Link></li>
            <li><Link to="/services">Gym & Yoga</Link></li>
          </ul>
        </FooterSection>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          © HOTELIER, ALL RIGHT RESERVED. DESIGNED BY <a href="https://htmlcodex.com" target="_blank" rel="noopener noreferrer">HTML CODEX</a>
        </p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/cookies">Cookies</Link>
          <Link to="/help">Help</Link>
          <Link to="/faqs">FAQs</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;