import { useEffect, useRef } from 'react';
import './Videobackground.css';

export default function VideoBackground({ children }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Video autoplay blocked:', err);
      });
    }
  }, []);

  return (
    <div className="vb-root">
      <video
        ref={videoRef}
        className="vb-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/img.mp4" type="video/mp4" />
      </video>
      <div className="vb-overlay" />
      <div className="vb-content">
        {children}
      </div>
    </div>
  );
}