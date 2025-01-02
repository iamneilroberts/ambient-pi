import React, { useState, useEffect, useCallback } from 'react';
import { config } from '../config/config.js';
import { useTheme } from './themes/ThemeProvider';

const PhotoFrame = () => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [preloadedImages, setPreloadedImages] = useState([]);
  const [error, setError] = useState(null);
  const { currentTheme } = useTheme();

  // Function to load photos from configured sources
  const loadPhotos = useCallback(async () => {
    try {
      const loadedPhotos = [];

      // Handle local photos
      const localSources = config.localServices.photos.sources
        .filter(source => source.type === 'local' && source.enabled);

      for (const source of localSources) {
        for (const pathConfig of source.paths) {
          try {
            console.log('Fetching local photos from:', pathConfig.path);
            const response = await fetch(`/api/photos/local?path=${encodeURIComponent(pathConfig.path)}`);
            if (!response.ok) throw new Error(`Failed to load local photos: ${response.statusText}`);
            const photos = await response.json();
            console.log('Loaded local photos:', JSON.stringify(photos, null, 2));
            loadedPhotos.push(...photos.map(photo => ({
              ...photo,
              type: 'local',
              sourceName: source.name
            })));
          } catch (err) {
            console.error(`Error loading photos from ${pathConfig.path}:`, err);
          }
        }
      }

      // Handle cached remote photos (e.g., Google Photos)
      const remoteSources = config.localServices.photos.sources
        .filter(source => source.type === 'cached_remote' && source.enabled);

      for (const source of remoteSources) {
        try {
          const response = await fetch(`/api/photos/cached?service=${source.service}`);
          if (!response.ok) throw new Error(`Failed to load cached photos: ${response.statusText}`);
          const photos = await response.json();
          loadedPhotos.push(...photos.map(photo => ({
            ...photo,
            type: 'remote',
            sourceName: source.name
          })));
        } catch (err) {
          console.error(`Error loading cached remote photos:`, err);
        }
      }

      // Shuffle if enabled
      if (config.localServices.photos.display.shuffle) {
        for (let i = loadedPhotos.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [loadedPhotos[i], loadedPhotos[j]] = [loadedPhotos[j], loadedPhotos[i]];
        }
      }

      console.log('Setting photos:', JSON.stringify(loadedPhotos, null, 2));
      setPhotos(loadedPhotos);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    }
  }, []);

  // Preload next images
  const preloadImages = useCallback(() => {
    if (photos.length === 0) return;

    const imagesToPreload = [];
    const preloadCount = config.localServices.photos.display.preloadCount || 2;

    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = (currentPhotoIndex + i) % photos.length;
      const photo = photos[nextIndex];
      if (photo) {
        const img = new Image();
        const imgUrl = `/api/photos/file?path=${encodeURIComponent(photo.path)}`;
        console.log('Preloading image:', imgUrl);
        img.onload = () => console.log('Image loaded successfully:', imgUrl);
        img.onerror = (err) => console.error('Image failed to load:', imgUrl, err);
        img.src = imgUrl;
        imagesToPreload.push(img);
      }
    }

    setPreloadedImages(imagesToPreload);
  }, [photos, currentPhotoIndex]);


  // Initial load
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Preload images when current photo changes
  useEffect(() => {
    preloadImages();
  }, [preloadImages, currentPhotoIndex]);

  // Handle photo rotation
  useEffect(() => {
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex(current => (current + 1) % photos.length);
    }, config.localServices.photos.display.interval);

    return () => clearInterval(interval);
  }, [photos]);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black text-white" style={{ minHeight: '100vh' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black text-white" style={{ minHeight: '100vh' }}>
        <p>Loading photos...</p>
      </div>
    );
  }

  const currentPhoto = photos[currentPhotoIndex];
  const photoUrl = `/api/photos/file?path=${encodeURIComponent(currentPhoto.path)}`;

  return (
    <div className="relative h-full w-full bg-black p-2 md:p-8" style={{ minHeight: '100vh' }}>
      <div className={`relative h-full w-full rounded-lg bg-gray-200 p-2 md:p-4 photo-frame theme-${currentTheme}-frame`}>
        <img
          src={photoUrl}
          alt={currentPhoto.name || 'Photo'}
          className="w-full h-full object-contain rounded"
          style={{
            opacity: 1,
            zIndex: 1
          }}
        onLoad={() => console.log('Current image loaded:', photoUrl)}
        onError={(err) => console.error('Current image failed to load:', photoUrl, err)}
      />
      
        {config.localServices.photos.display.showMetadata && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 md:p-4 rounded-b" style={{ zIndex: 2 }}>
          <p className="text-base md:text-lg">{currentPhoto.name}</p>
          {currentPhoto.metadata && (
            <p className="text-xs md:text-sm opacity-75">
              {currentPhoto.metadata.dateTaken && 
                new Date(currentPhoto.metadata.dateTaken).toLocaleDateString()}
              {currentPhoto.metadata.camera && ` • ${currentPhoto.metadata.camera}`}
            </p>
          )}
          <p className="text-sm opacity-75">Source: {currentPhoto.sourceName}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoFrame;
