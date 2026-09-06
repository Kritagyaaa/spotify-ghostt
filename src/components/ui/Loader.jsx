import React from 'react';
import './Loader.css';

export function Loader({ fullScreen = false, text = "Loading..." }) {
  const letters = text.split('');

  return (
    <div className={`loader-container ${fullScreen ? 'full-screen' : ''}`}>
      <div className="loader-wrapper">
        <div className="loader"></div>
        <div className="letter-wrapper">
          {letters.map((char, index) => (
            <span key={index} className="loader-letter">
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Loader;
