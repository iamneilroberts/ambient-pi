import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Volume2, VolumeX } from 'lucide-react';

const WeatherAlerts = ({ alerts }) => {
  const [muted, setMuted] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Create audio instance
  const [audio] = useState(() => {
    const audioInstance = new Audio('/sounds/weather-alert.mp3');
    audioInstance.addEventListener('error', (e) => {
      console.error('Audio loading error:', e.target.error);
    });
    return audioInstance;
  });

  // Handle audio loading
  useEffect(() => {
    const handleCanPlay = () => {
      console.log('Alert sound loaded successfully');
      setAudioLoaded(true);
    };
    
    audio.addEventListener('canplaythrough', handleCanPlay);
    
    // Try to load the audio
    audio.load();
    
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
    };
  }, [audio]);

  // Update audio muted state
  useEffect(() => {
    audio.muted = muted;
  }, [muted, audio]);

  // Play alert sound
  const playAlertSound = useCallback(() => {
    if (!audioLoaded) {
      console.log('Audio not yet loaded, trying to load...');
      audio.load();
      return;
    }

    try {
      console.log('Attempting to play alert sound...');
      // Reset audio to start if it's already playing
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Alert sound playing successfully');
          })
          .catch(error => {
            console.error('Error playing alert sound:', error);
          });
      }
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }, [audio, audioLoaded]);

  // Handle new alerts
  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    // Get the most recent alert
    const latestAlert = alerts.reduce((latest, current) => {
      const currentTime = new Date(current.expires).getTime();
      return !latest || currentTime > new Date(latest.expires).getTime() ? current : latest;
    }, null);

    // Only play sound if it's a new alert
    if (latestAlert && (!lastAlertTime || new Date(latestAlert.expires).getTime() !== lastAlertTime)) {
      setLastAlertTime(new Date(latestAlert.expires).getTime());
      if (!muted && audioLoaded) {
        playAlertSound();
      }
    }
  }, [alerts, muted, lastAlertTime, audio, audioLoaded, playAlertSound]);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-bold">Active Weather Alerts</h2>
        </div>
        <button 
          onClick={() => setMuted(!muted)}
          className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50"
          title={muted ? "Unmute Alerts" : "Mute Alerts"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button
          onClick={playAlertSound}
          className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 ml-2"
          title="Test Alert Sound"
          disabled={!audioLoaded}
        >
          Test Sound
        </button>
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        {alerts.map((alert, index) => (
          <div 
            key={index} 
            className={`bg-black/30 rounded-lg p-3 ${
              alert.severity === 'Extreme' ? 'border-2 border-red-500' :
              alert.severity === 'Severe' ? 'border border-orange-500' : ''
            }`}
          >
            <div className="font-bold text-lg">
              {alert.event}
            </div>
            <div className="text-sm opacity-90">
              {alert.areaDesc}
            </div>
            <div className="text-sm mt-1">
              Until {new Date(alert.expires).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div className="text-sm mt-2 opacity-80 line-clamp-2">
              {alert.description}
            </div>
            {alert.instruction && (
              <div className="text-sm mt-2 text-yellow-300">
                {alert.instruction}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherAlerts;
