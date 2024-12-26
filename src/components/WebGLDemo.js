import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

// List of verified working WebGL demos
const WORKING_DEMOS = [
  {
    name: 'Aquarium',
    source: 'WebGL Samples',
    url: 'https://webglsamples.org/aquarium/aquarium.html',
    active: true
  },
  {
    name: 'Blob',
    source: 'WebGL Samples',
    url: 'https://webglsamples.org/blob/blob.html',
    active: true
  },
  {
    name: 'City',
    source: 'WebGL Samples',
    url: 'https://webglsamples.org/city/city.html',
    active: true
  },
  {
    name: 'Electric Flower',
    source: 'WebGL Samples',
    url: 'https://webglsamples.org/electricflower/electricflower.html',
    active: true
  },
  {
    name: 'Field',
    source: 'WebGL Samples',
    url: 'https://webglsamples.org/field/field.html',
    active: true
  },
  {
    name: 'Fish Tank',
    source: 'WebGL Samples',
    url: 'https://webglsamples.org/fishtank/fishtank.html',
    active: true
  },
  {
    name: 'Halo',
    source: 'WebGL Samples',
    url: 'https://webglsamples.org/halo/halo.html',
    active: true
  },
  {
    name: 'Blobs',
    source: 'Thorium Rocks',
    url: 'https://thorium.rocks/media/blobs/blobs.html',
    active: true
  },
  {
    name: 'Gravitatio',
    source: 'Thorium Rocks',
    url: 'https://thorium.rocks/media/gravitatio/gravitatio.html',
    active: true
  }
];

const WebGLDemo = ({ rotationInterval = 300 }) => {
  const [currentDemo, setCurrentDemo] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Select a random demo from active demos
  const selectRandomDemo = () => {
    const activeDemos = WORKING_DEMOS.filter(demo => demo.active);
    if (activeDemos.length === 0) {
      setError('No active demos available');
      return null;
    }
    return activeDemos[Math.floor(Math.random() * activeDemos.length)];
  };

  // Handle demo rotation
  useEffect(() => {
    setCurrentDemo(selectRandomDemo());
    const interval = setInterval(() => {
      setCurrentDemo(selectRandomDemo());
    }, rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [rotationInterval]);

  // Handle iframe loading states
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError(`Failed to load demo: ${currentDemo?.name}`);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div className="text-xl">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-900">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="text-white text-xl">Loading demo...</div>
        </div>
      )}

      {/* Current demo display */}
      {currentDemo && (
        <>
          <iframe
            src={currentDemo.url}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={currentDemo.name}
          />
          
          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 transform transition-transform duration-300 hover:translate-y-0 translate-y-full">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">{currentDemo.name}</div>
                <div className="text-sm text-gray-300">{currentDemo.source}</div>
              </div>
              <div className="text-sm">
                Next demo in {Math.ceil(rotationInterval)} seconds
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WebGLDemo;
