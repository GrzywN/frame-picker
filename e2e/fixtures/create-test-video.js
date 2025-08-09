#!/usr/bin/env node

/**
 * Creates a small test video file for E2E tests
 * Requires ffmpeg to be installed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'test-video.mp4');

// Check if ffmpeg is available
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch (error) {
  console.log('ffmpeg not found. Creating a dummy MP4 file with MP4 headers...');
  
  // Create a minimal MP4 file with proper headers (won't be playable but will pass MIME type checks)
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x20, // Box size
    0x66, 0x74, 0x79, 0x70, // Box type 'ftyp'
    0x69, 0x73, 0x6F, 0x6D, // Major brand 'isom'
    0x00, 0x00, 0x02, 0x00, // Minor version
    0x69, 0x73, 0x6F, 0x6D, // Compatible brand 'isom'
    0x69, 0x73, 0x6F, 0x32, // Compatible brand 'iso2'
    0x61, 0x76, 0x63, 0x31, // Compatible brand 'avc1'
    0x6D, 0x70, 0x34, 0x31  // Compatible brand 'mp41'
  ]);
  
  // Add some dummy data to make it a reasonable size
  const dummyData = Buffer.alloc(1024 * 10); // 10KB of zeros
  const finalBuffer = Buffer.concat([mp4Header, dummyData]);
  
  fs.writeFileSync(OUTPUT_FILE, finalBuffer);
  console.log(`Created dummy test video: ${OUTPUT_FILE}`);
  return;
}

try {
  // Create a 5-second test video with a colorful pattern
  const command = `ffmpeg -f lavfi -i "testsrc2=duration=5:size=640x480:rate=1" -c:v libx264 -t 5 -pix_fmt yuv420p -y "${OUTPUT_FILE}"`;
  
  console.log('Creating test video with ffmpeg...');
  execSync(command, { stdio: 'inherit' });
  
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`Created test video: ${OUTPUT_FILE} (${Math.round(stats.size / 1024)}KB)`);
  
} catch (error) {
  console.error('Failed to create test video:', error.message);
  process.exit(1);
}