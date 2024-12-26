import React, { useState, useEffect } from 'react';

const MatrixRain = ({ duration }) => {
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops = Array(columns).fill(0);
    
    const chars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ01234567890".split("");

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0F0';
      ctx.font = '15px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, [duration]);

  return <canvas className="absolute inset-0" />;
};

const TransitionManager = ({ children, effect, duration }) => {
  const [currentContent, setCurrentContent] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentEffect, setCurrentEffect] = useState(effect || 'fade');

  useEffect(() => {
    if (children !== currentContent) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentContent(children);
        setIsTransitioning(false);
      }, duration * 1000);
    }
  }, [children, duration]);

  const getTransitionStyle = () => {
    const baseStyle = {
      transition: `all ${duration}s ease-in-out`,
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    };

    switch (currentEffect) {
      case 'fade':
        return {
          ...baseStyle,
          opacity: isTransitioning ? 0 : 1
        };
      case 'slide':
        return {
          ...baseStyle,
          transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)'
        };
      case 'dissolve':
        return {
          ...baseStyle,
          opacity: isTransitioning ? 0 : 1,
          filter: `blur(${isTransitioning ? '10px' : '0px'})`
        };
      case 'wave':
        return {
          ...baseStyle,
          transform: isTransitioning ? 'translateY(-100%) rotate(5deg)' : 'translateY(0) rotate(0deg)',
          transformOrigin: 'center center'
        };
      case 'matrix':
        return {
          ...baseStyle,
          opacity: isTransitioning ? 0 : 1
        };
      default:
        return baseStyle;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div style={getTransitionStyle()}>
        {currentContent}
      </div>
      {isTransitioning && currentEffect === 'matrix' && (
        <div className="absolute inset-0 pointer-events-none">
          <MatrixRain duration={duration} />
        </div>
      )}
    </div>
  );
};

export default TransitionManager;
