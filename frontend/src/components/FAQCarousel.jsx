import React, { useState, useEffect } from 'react';
import './FAQCarousel.css';

const FAQCarousel = ({ faqs }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % faqs.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + faqs.length) % faqs.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <div className="faq-carousel">
      <div className="carousel-container">
        <button onClick={prevSlide} className="carousel-nav prev">
          <i className="ri-arrow-left-s-line"></i>
        </button>

        <div className="carousel-track">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
            >
              <div className="faq-card">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={nextSlide} className="carousel-nav next">
          <i className="ri-arrow-right-s-line"></i>
        </button>
      </div>

      <div className="carousel-indicators">
        {faqs.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="autoplay-toggle"
        title={isAutoPlaying ? 'Pause autoplay' : 'Start autoplay'}
      >
        <i className={isAutoPlaying ? 'ri-pause-line' : 'ri-play-line'}></i>
      </button>
    </div>
  );
};

export default FAQCarousel;
