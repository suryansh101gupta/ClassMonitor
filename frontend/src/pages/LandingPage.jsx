import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: 'ri-time-line',
      title: 'Real-Time Attendance & Monitoring',
      description: 'Streamline the way you track student presence and engagement during sessions.'
    },
    {
      icon: 'ri-task-line',
      title: 'Task & Assignment Management',
      description: 'Distribute, collect, and review student work within a unified dashboard.'
    },
    {
      icon: 'ri-bar-chart-line',
      title: 'Performance Analytics',
      description: 'Visualize student trends and identify those who may need extra support through automated data insights.'
    },
    {
      icon: 'ri-folder-shared-line',
      title: 'Centralized Resource Sharing',
      description: 'Upload lecture notes, scripts, and reading materials directly to the class portal.'
    },
    {
      icon: 'ri-smartphone-line',
      title: 'Interactive Interface',
      description: 'A user-friendly design built for both mobile and desktop environments to ensure accessibility for all users.'
    }
  ];

  const faqs = [
    {
      question: 'What is ClassMonitor?',
      answer: 'ClassMonitor is a digital tool designed for educators to manage classroom workflows, including attendance, assignment tracking, and student performance monitoring.'
    },
    {
      question: 'How do I get started with the app?',
      answer: 'Users can get started by creating an account as either a Teacher or a Student. Teachers can then create "Classrooms" and invite students using a unique join code or email invitation.'
    },
    {
      question: 'Is my data secure on ClassMonitor?',
      answer: 'Yes. ClassMonitor uses industry standard encryption and secure authentication protocols to ensure that student records and classroom data remain private and accessible only to authorized users.'
    },
    {
      question: 'Can I use ClassMonitor on my mobile phone?',
      answer: 'Absolutely. The application is built with a responsive design (MERN stack architecture), allowing it to function seamlessly across web browsers on desktops, tablets, and smartphones.'
    },
    {
      question: 'How does the attendance tracking work?',
      answer: 'Teachers can initiate an attendance session where students check in via the app. The system automatically timestamps entries and generates a report for the teacher\'s records.'
    },
    {
      question: 'Can I export student performance data?',
      answer: 'Yes, the app allows teachers to generate summaries and reports of student activity and grades, which can be reviewed within the app or exported for external record-keeping.'
    },
    {
      question: 'Who do I contact for technical support?',
      answer: 'For technical issues, bugs, or feature requests, please visit the official GitHub repository at github.com/suryansh101gupta/classmonitor and open an "Issue," or contact the administrator directly through the app\'s support section.'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="landing-page">
      {/* Abstract Background Shapes */}
      <div className="abstract-shape shape-circle"></div>
      <div className="abstract-shape shape-square"></div>
      <div className="abstract-shape shape-triangle"></div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <img src="/cm_logo.png" alt="ClassMonitor" className="h-16 w-auto" />
            <h1 className="hero-title">ClassMonitor</h1>
          </div>
          <p className="hero-tagline">Classroom Management & Engagement Simplified</p>
          <div className="hero-buttons">
            <button onClick={() => navigate('/login')} className="hero-btn primary-btn">
              <i className="ri-user-line"></i> Login as Student
            </button>
            <button onClick={() => navigate('/teacher-login')} className="hero-btn secondary-btn">
              <i className="ri-user-teacher-line"></i> Login as Teacher
            </button>
            <button onClick={() => navigate('/admin-login')} className="hero-btn admin-btn">
              <i className="ri-admin-line"></i> Admin Login
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="section-container">
          <h2 className="section-title">About ClassMonitor</h2>
          <div className="about-content">
            <p className="about-text">
              ClassMonitor is a comprehensive classroom management application designed to bridge the gap between educators and students. By leveraging real-time tracking and intuitive organization tools, the app helps teachers monitor classroom activities, track student progress, and maintain an organized learning environment. Whether you are managing a small workshop or a large lecture hall, ClassMonitor provides the digital infrastructure to keep your classroom focused and productive.
            </p>
          </div>
        </div>
      </section>

      {/* Features Carousel */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Key Features</h2>
          <div className="carousel-wrapper">
            <button onClick={prevSlide} className="carousel-nav prev-btn">
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <div className="carousel-content">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="carousel-item"
                  style={{ display: index === currentSlide ? 'flex' : 'none' }}
                >
                  <div className="feature-card">
                    <div className="feature-icon">
                      <i className={feature.icon}></i>
                    </div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={nextSlide} className="carousel-nav next-btn">
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
          <div className="carousel-dots">
            {features.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-grid-section">
        <div className="section-container">
          <h2 className="section-title">All Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-grid-card">
                <div className="feature-grid-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3 className="feature-grid-title">{feature.title}</h3>
                <p className="feature-grid-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="faq-number">{index + 1}.</span>
                  <span className="faq-text">{faq.question}</span>
                  <i className={`faq-icon ${activeFaq === index ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                </button>
                {activeFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/cm_logo.png" alt="ClassMonitor" className="h-8 w-auto" />
            <span>ClassMonitor</span>
          </div>
          <p className="footer-text">© 2026 ClassMonitor. All rights reserved.</p>
          <div className="footer-links">
            <a href="https://github.com/suryansh101gupta/classmonitor" target="_blank" rel="noopener noreferrer" className="footer-link">
              <i className="ri-github-fill"></i> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
