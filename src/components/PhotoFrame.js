import React, { useState, useEffect } from 'react';
import { Image, AlertCircle } from 'lucide-react';

const PhotoFrame = () => {
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [nextPhoto, setNextPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [photoList, setPhotoList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get the backend URL - use the same host as the current page but with port 3002
  const getBackendUrl = () => {
    const currentHost = window.location.hostname;
    return `http://${currentHost}:3002`;
  };

  // Function to load photos
  const loadPhotoList = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/local-photos`);
      const data = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        // Prepend the backend URL to the photo paths
        const fullPhotoPaths = data.photos.map(photo => `${backendUrl}${photo}`);
        setPhotoList(fullPhotoPaths);
        setError(null);
      } else {
        setError('No photos found');
      }
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    }
  };

  // Initialize photo list
  useEffect(() => {
    loadPhotoList();
  }, []);

  // Handle photo rotation
  useEffect(() => {
    if (photoList.length === 0) return;

    const rotatePhoto = () => {
      setIsTransitioning(true);
      setNextPhoto(photoList[(currentIndex + 1) % photoList.length]);
      
      setTimeout(() => {
        setCurrentPhoto(photoList[(currentIndex + 1) % photoList.length]);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % photoList.length);
        setIsTransitioning(false);
      }, 1000);
    };

    setCurrentPhoto(photoList[currentIndex]);
    const interval = setInterval(rotatePhoto, 5000);

    return () => clearInterval(interval);
  }, [photoList, currentIndex]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div className="text-xl">{error}</div>
          <div className="text-sm text-gray-400">Backend URL: {getBackendUrl()}</div>
        </div>
      </div>
    );
  }

  if (!currentPhoto) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <Image className="w-16 h-16 animate-pulse mx-auto" />
          <div className="text-xl">Loading photos...</div>
          <div className="text-sm text-gray-400">Backend URL: {getBackendUrl()}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Current Photo */}
      <img
        src={currentPhoto}
        alt="Current"
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      />
      
      {/* Next Photo (for smooth transition) */}
      {nextPhoto && (
        <img
          src={nextPhoto}
          alt="Next"
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}
      
      {/* Photo Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 transform transition-transform duration-300 hover:translate-y-0 translate-y-full">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            Photo {currentIndex + 1} of {photoList.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoFrame;
