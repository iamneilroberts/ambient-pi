const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const heicConvert = require('heic-convert');
// Import config directly
const { config } = require('../../config.cjs');
const GooglePhotosService = require('./googlePhotosService');
const googlePhotos = new GooglePhotosService();

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.HEIC'];

// Cache directory for converted images
// Helper function to resolve paths relative to project root
function resolveProjectPath(relativePath) {
  const projectRoot = path.resolve(__dirname, '../..');
  return path.resolve(projectRoot, relativePath);
}

// Single source of truth for photo cache directory
const CACHE_DIR = path.resolve(__dirname, '../photo-cache'); // backend/photo-cache

// Ensure cache directory exists
if (!fsSync.existsSync(CACHE_DIR)) {
  fsSync.mkdirSync(CACHE_DIR, { recursive: true });
}

// Convert HEIC to JPEG
async function convertHeicToJpeg(inputPath) {
  try {
    const inputBuffer = await fs.readFile(inputPath);
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9
    });

    const outputPath = path.join(
      CACHE_DIR,
      `${path.basename(inputPath, path.extname(inputPath))}.jpg`
    );
    
    await fs.writeFile(outputPath, outputBuffer);
    return outputPath;
  } catch (err) {
    throw new Error(`Failed to convert HEIC file: ${err.message}`);
  }
}

// Get all photos from a directory recursively
async function getPhotosFromDirectory(dirPath, recursive = true) {
  const photos = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory() && recursive) {
        const subDirPhotos = await getPhotosFromDirectory(fullPath, recursive);
        photos.push(...subDirPhotos);
      } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        const stats = await fs.stat(fullPath);
        let photoPath = fullPath;
        
        // Get path relative to project root
        const relativePath = path.relative(path.resolve(__dirname, '../..'), photoPath);
        photos.push({
          name: entry.name,
          path: relativePath,
          size: stats.size,
          metadata: {
            dateTaken: stats.mtime,
            originalFormat: path.extname(entry.name).slice(1).toUpperCase()
          }
        });
        }
      }
    }
    
    return photos;
  } catch (err) {
    return []; // Silently skip directories with access errors
  }
}

// Get cached remote photos
async function getCachedPhotos(service) {
  const cacheConfig = config.localServices.photos.sources.find(
    source => source.type === 'cached_remote' && source.service === service
  );
  
  if (!cacheConfig || !cacheConfig.enabled) {
    return [];
  }
  
  try {
    const cacheDir = CACHE_DIR;

    // If it's a Google Photos album, sync it first
    let photos = [];
    if (service === 'google_photos' && cacheConfig.albumUrl) {
      photos = await googlePhotos.syncAlbum(cacheConfig.albumUrl, cacheDir);
    } else {
      photos = await getPhotosFromDirectory(cacheDir, true);
    }
    
    return photos.map(photo => {
      // For cached photos, just use the filename
      const filename = path.basename(photo.path);
      return {
        ...photo,
        path: filename,  // Store just the filename
        url: `/api/photos/file?path=${encodeURIComponent(filename)}`
      };
    });
  } catch (err) {
    return []; // Silently skip cache errors
  }
}

// Set up periodic sync for Google Photos
function setupGooglePhotosSync() {
  const googlePhotosConfig = config.localServices.photos.sources.find(
    source => source.type === 'cached_remote' && source.service === 'google_photos' && source.enabled
  );

  if (googlePhotosConfig && googlePhotosConfig.syncStrategy === 'periodic') {
    const syncInterval = googlePhotosConfig.syncInterval * 1000;
    
    // Initial sync
    googlePhotos.syncAlbum(googlePhotosConfig.albumUrl, CACHE_DIR)
      .catch(() => {}); // Silently handle sync errors
    
    // Set up periodic sync
    setInterval(() => {
      googlePhotos.syncAlbum(googlePhotosConfig.albumUrl, CACHE_DIR)
        .catch(() => {}); // Silently handle sync errors
    }, syncInterval);
  }
}

// Express route handlers
function setupPhotoRoutes(app) {
  // Initialize Google Photos sync if configured
  setupGooglePhotosSync();
  // List local photos
  app.get('/api/photos/local', async (req, res) => {
    try {
      const dirPath = req.query.path;
      if (!dirPath) {
        return res.status(400).json({ error: 'Path parameter is required' });
      }

      // Basic path validation
      const photosDir = resolveProjectPath('photos');
      const normalizedPath = resolveProjectPath(dirPath);
      const projectRoot = path.resolve(__dirname, '../..');
      if (!normalizedPath.startsWith(projectRoot)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const photos = await getPhotosFromDirectory(normalizedPath);
      res.json(photos);
    } catch (err) {
      console.error('Error listing local photos:', err);
      res.status(500).json({ error: 'Failed to list photos' });
    }
  });

  // Serve photo files
  app.get('/api/photos/file', async (req, res) => {
    try {
      const filePath = req.query.path;
      if (!filePath) {
        return res.status(400).json({ error: 'Path parameter is required' });
      }

      // Basic path validation and path resolution
      const projectRoot = path.resolve(__dirname, '../..');
      let normalizedPath;
      
      // Handle paths differently based on whether they're cached or local
      if (filePath.startsWith('backend/photo-cache/')) {
        // For cached photos, resolve from project root
        normalizedPath = resolveProjectPath(filePath);
      } else if (filePath.includes('/')) {
        // For local photos with path separators, resolve from project root
        normalizedPath = resolveProjectPath(filePath);
      } else {
        // For cached photos with just filename, resolve from cache dir
        normalizedPath = path.join(CACHE_DIR, filePath);
      }

      // Validate path is within project
      if (!normalizedPath.startsWith(projectRoot)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if file exists
      try {
        await fs.access(normalizedPath);
      } catch (err) {
      return res.status(404).json({ error: 'Photo not found' });
      }
      
      // Check if it's a HEIC file that needs conversion
      const ext = path.extname(normalizedPath).toLowerCase();
      if (ext === '.heic' || ext === '.HEIC') {
        try {
          const jpegPath = await convertHeicToJpeg(normalizedPath);
          res.sendFile(jpegPath);
        } catch (err) {
          res.status(500).json({ error: 'Failed to convert HEIC file' });
        }
      } else {
        // Stream the file
        res.sendFile(normalizedPath);
      }
    } catch (err) {
      res.status(404).json({ error: 'Photo not found' });
    }
  });

  // List cached remote photos
  app.get('/api/photos/cached', async (req, res) => {
    try {
      const service = req.query.service;
      if (!service) {
        return res.status(400).json({ error: 'Service parameter is required' });
      }

      const photos = await getCachedPhotos(service);
      res.json(photos);
    } catch (err) {
      res.status(500).json({ error: 'Failed to list cached photos' });
    }
  });
}

module.exports = {
  setupPhotoRoutes
};
