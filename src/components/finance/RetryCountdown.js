import React, { useState, useEffect } from 'react';

const RetryCountdown = ({ onComplete, initialSeconds = 60 }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onComplete]);

  return (
    <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center">
        <div className="text-yellow-400 mb-2">
          Rate limit reached. Retrying in:
        </div>
        <div className="text-2xl font-bold text-white">
          {seconds} seconds
        </div>
      </div>
    </div>
  );
};

export default RetryCountdown;
