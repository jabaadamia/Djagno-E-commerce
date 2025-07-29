import { useState } from 'react';
import '../styles/ImageSlider.css';

function getImageSrc(img) {
  if (img instanceof File) {
    return URL.createObjectURL(img);
  } else if (img && typeof img === 'object' && img.image) {
    return img.image;
  } else if (typeof img === 'string') {
    return img;
  }
  return '';
}

function ImageSlider({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="image-slider">
      <div className="slider-container">
        <img
          src={getImageSrc(images[currentIndex])}
          alt={`Product image ${currentIndex + 1}`}
          className="slider-image"
        />
        {images.length > 1 && (
          <>
            <button className="slider-button prev" onClick={goToPrevious}>
              ←
            </button>
            <button className="slider-button next" onClick={goToNext}>
              →
            </button>
            <div className="slider-dots">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ImageSlider;
