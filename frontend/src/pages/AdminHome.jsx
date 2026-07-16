import React from 'react';
import AdminNavbar from '../components/AdminNavbar';
import AdminHeader from '../components/AdminHeader';
import FAQCarousel from '../components/FAQCarousel';
import './AdminHome.css';

const AdminHome = () => {
  const faqs = [];
  return (
    <div className="home-page">
      <AdminNavbar />
      <div className="hero-section">
          <AdminHeader />
      </div>
    </div>
  );
};

export default AdminHome;
