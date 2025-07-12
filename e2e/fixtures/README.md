# Test Fixtures

This directory contains test files used for E2E testing.

## Video Files

For video upload testing, you'll need to place test video files here:

- `test-video.mp4` - A small test video file (recommended: 10-30 seconds, <10MB)
- `large-video.mp4` - A larger video file for testing file size limits
- `invalid-file.txt` - A non-video file for testing file type validation

## Creating Test Videos

You can create test videos using FFmpeg:

```bash
# Create a small test video (10 seconds, 720p)
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 -pix_fmt yuv420p test-video.mp4

# Create a larger test video
ffmpeg -f lavfi -i testsrc=duration=30:size=1920x1080:rate=30 -pix_fmt yuv420p large-video.mp4
```

Or use any existing short video files you have available.

## File Requirements

- Video files should be in common formats: MP4, AVI, MOV, WebM
- Keep file sizes reasonable for testing (under 50MB for CI)
- Include both valid and invalid file types for comprehensive testing