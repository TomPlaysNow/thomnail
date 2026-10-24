const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SUPPORTED_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.avi'];

function getVideoFiles(folderPath, recursive = false) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory() && recursive) {
      files = files.concat(getVideoFiles(fullPath, true));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function extractFrame(videoPath, ffmpegPath, framePosition = '50%') {
  return new Promise((resolve, reject) => {
    const thumbPath = path.join(
      os.tmpdir(),
      `thomnail_${Date.now()}_${path.basename(videoPath, path.extname(videoPath))}.png`
    );

    // Set binary paths globally for fluent-ffmpeg
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
      const ffprobePath = path.join(path.dirname(ffmpegPath), 'ffprobe');
      if (fs.existsSync(ffprobePath)) {
        ffmpeg.setFfprobePath(ffprobePath);
      }
    }

    // Probe duration to convert "50%" → exact seek time in seconds
    ffmpeg.ffprobe(videoPath, (probeErr, metadata) => {
      const duration = probeErr ? 60 : (metadata.format.duration || 60);
      const pct = Math.min(Math.max(parseInt(framePosition) || 50, 1), 99) / 100;
      const seekTime = duration * pct;

      // Extract one frame; scale to fit 320×320, pad remainder with black
      // so portrait videos get pillarbox bars instead of being stretched
      ffmpeg(videoPath)
        .seekInput(seekTime)
        .frames(1)
        .videoFilters(
          'scale=320:320:force_original_aspect_ratio=decrease,' +
          'pad=320:320:(ow-iw)/2:(oh-ih)/2:color=black'
        )
        .output(thumbPath)
        .on('end', () => resolve(thumbPath))
        .on('error', (err) => reject(err))
        .run();
    });
  });
}

module.exports = { getVideoFiles, extractFrame };
