#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Keep only the most recent log file in each directory
function cleanupLogs(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`Directory ${directory} does not exist, skipping...`);
        return;
    }

    const files = fs.readdirSync(directory)
        .filter(file => file.startsWith('system.log'))
        .map(file => ({
            name: file,
            path: path.join(directory, file),
            mtime: fs.statSync(path.join(directory, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

    // Keep the most recent file
    const filesToDelete = files.slice(1);
    
    filesToDelete.forEach(file => {
        try {
            fs.unlinkSync(file.path);
            console.log(`Deleted old log file: ${file.name}`);
        } catch (err) {
            console.error(`Error deleting ${file.name}:`, err);
        }
    });
}

// Clean up photo cache
function cleanupPhotoCache() {
    const cacheDir = path.join(__dirname, '../backend/photo-cache');
    if (!fs.existsSync(cacheDir)) {
        console.log('Photo cache directory does not exist, skipping...');
        return;
    }

    const files = fs.readdirSync(cacheDir);
    files.forEach(file => {
        try {
            fs.unlinkSync(path.join(cacheDir, file));
            console.log(`Deleted cached photo: ${file}`);
        } catch (err) {
            console.error(`Error deleting ${file}:`, err);
        }
    });
}

// Clean up both log directories
cleanupLogs(path.join(__dirname, '../logs'));
cleanupLogs(path.join(__dirname, '../backend/logs'));

// Clean up photo cache
cleanupPhotoCache();

console.log('Cleanup completed');
