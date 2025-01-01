const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { fetchImageUrls } = require('google-photos-album-image-url-fetch');

class GooglePhotosService {
  async downloadPhoto(photoUrl, cacheDir) {
    try {
      // Generate filename from just the URL (without timestamp) for consistency
      const hash = crypto.createHash('md5').update(photoUrl).digest('hex');
      const fileName = `${hash}.jpg`;
      const filePath = path.resolve(cacheDir, fileName);

      // Check if file already exists in cache
      try {
        await fs.access(filePath);
        // Photo exists in cache, return silently
        
        // Return existing photo info
        const stats = await fs.stat(filePath);
        return {
          name: fileName,
          path: filePath,
          size: stats.size,
          metadata: {
            dateTaken: stats.mtime,
            originalFormat: 'JPG'
          }
        };
      } catch (err) {
        // File doesn't exist, proceed with download
      }

      const response = await axios({
        url: photoUrl,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://photos.google.com/'
        }
      });

      // Ensure cache directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, response.data);
      
      return {
        name: fileName,
        path: filePath,
        size: response.data.length,
        metadata: {
          dateTaken: new Date().toISOString(),
          originalFormat: 'JPG'
        }
      };
    } catch (error) {
      throw new Error(`Failed to download photo: ${error.message}`);
    }
  }

  async syncAlbum(albumUrl, cacheDir) {
    try {
      // Create cache directory if it doesn't exist
      await fs.mkdir(cacheDir, { recursive: true });
      // Fetch image URLs from the album
      const imageUrls = await fetchImageUrls(albumUrl);
      const photos = [];
      for (const item of imageUrls) {
        try {
          // Extract URL from the item
          const url = typeof item === 'string' ? item : item.url || item.src;
          if (!url) {
            // Skip items without URLs
            continue;
          }
          // Add size parameter for full resolution
          const fullSizeUrl = url.includes('=') ? url : `${url}=w2048-h2048`;
          const photo = await this.downloadPhoto(fullSizeUrl, cacheDir);
          photos.push(photo);
        } catch (err) {
          // Skip failed downloads silently
        }
      }

      return photos;
    } catch (error) {
      throw new Error(`Failed to sync album: ${error.message}`);
    }
  }
}

module.exports = GooglePhotosService;
