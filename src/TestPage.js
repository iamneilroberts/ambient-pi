import React, { useState } from 'react';

// Importing the WebGLDemo component we just created
const WebGLDemo = React.lazy(() => import('./components/WebGLDemo'));

const TestPage = () => {
  const [rotationInterval, setRotationInterval] = useState(30); // Default to 30 seconds for testing
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Test Controls */}
      <div 
        className={`fixed top-0 left-0 bg-black bg-opacity-75 text-white p-4 z-50 transition-transform duration-300 ${
          showControls ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">
              Rotation Interval (seconds):
            </label>
            <input
              type="number"
              value={rotationInterval}
              onChange={(e) => setRotationInterval(Number(e.target.value))}
              min="5"
              max="3600"
              className="bg-gray-700 text-white px-2 py-1 rounded w-24"
            />
          </div>
          <div className="text-sm text-gray-300">
            Current interval: {rotationInterval} seconds
          </div>
        </div>
      </div>

      {/* Toggle Controls Button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded z-50 hover:bg-gray-700"
      >
        {showControls ? 'Hide Controls' : 'Show Controls'}
      </button>

      {/* WebGL Demo Component */}
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
          Loading WebGL Demo...
        </div>
      }>
        <WebGLDemo rotationInterval={rotationInterval} />
      </React.Suspense>
    </div>
  );
};

export default TestPage;
