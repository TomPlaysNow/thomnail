const { ipcMain, dialog, app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { getVideoFiles, extractFrame } = require('./video');

// Homebrew (Apple Silicon / Intel), MacPorts
const FFMPEG_CANDIDATES = [
  '/opt/homebrew/bin/ffmpeg',
  '/usr/local/bin/ffmpeg',
  '/opt/local/bin/ffmpeg',
];
const DEFAULT_FRAME_POSITION = '50%';

function findFfmpeg() {
  // Empty string falls back to ffmpeg from PATH (fluent-ffmpeg default)
  return FFMPEG_CANDIDATES.find((p) => fs.existsSync(p)) || '';
}

// Loaded from userData on setupIPC(), saved on every change
let settings = null;

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

// Before 1.2.0 the app was called videothumb and kept its settings there
function migrateLegacySettings() {
  const legacyPath = path.join(app.getPath('appData'), 'videothumb', 'settings.json');
  if (fs.existsSync(getSettingsPath()) || !fs.existsSync(legacyPath)) return;
  try {
    fs.mkdirSync(path.dirname(getSettingsPath()), { recursive: true });
    fs.copyFileSync(legacyPath, getSettingsPath());
  } catch (err) {
    console.error('Alte Einstellungen konnten nicht übernommen werden:', err);
  }
}

function loadSettings() {
  migrateLegacySettings();
  const defaults = {
    ffmpegPath: findFfmpeg(),
    framePosition: DEFAULT_FRAME_POSITION,
    recursive: false,
    skipProcessed: false,
  };
  try {
    const stored = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf8'));
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error('Einstellungen konnten nicht gespeichert werden:', err);
  }
}

// A custom Finder icon sets the kHasCustomIcon flag (0x0400) in the
// FinderInfo xattr, i.e. bit 0x04 of byte 8.
function hasCustomIcon(filePath) {
  return new Promise((resolve) => {
    execFile('/usr/bin/xattr', ['-px', 'com.apple.FinderInfo', filePath], (err, stdout) => {
      if (err) return resolve(false);
      const bytes = stdout.trim().split(/\s+/);
      resolve(bytes.length > 8 && (parseInt(bytes[8], 16) & 0x04) !== 0);
    });
  });
}

function getHelperPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'swift-helper');
  }
  return path.join(app.getAppPath(), 'resources', 'swift-helper');
}

function setIconViaHelper(videoPath, thumbPath) {
  return new Promise((resolve, reject) => {
    const helperPath = getHelperPath();
    execFile(helperPath, [videoPath, thumbPath], (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve();
      }
    });
  });
}

// Registered once per app lifetime; the window is resolved per request,
// because macOS re-creates windows on 'activate'.
function setupIPC() {
  settings = loadSettings();

  ipcMain.handle('fs:isDirectory', (event, p) => {
    try {
      return fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

  ipcMain.handle('dialog:openFolder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('process:start', async (event, folderPath) => {
    const sender = event.sender;
    const send = (data) => {
      if (!sender.isDestroyed()) sender.send('process:progress', data);
    };
    const files = getVideoFiles(folderPath, settings.recursive);

    if (files.length === 0) {
      return { success: 0, skipped: 0, total: 0 };
    }

    // Notify renderer of all files first
    for (const filePath of files) {
      send({
        file: path.basename(filePath),
        filePath,
        status: 'pending',
      });
    }

    let success = 0;
    let skipped = 0;

    for (const filePath of files) {
      if (settings.skipProcessed && (await hasCustomIcon(filePath))) {
        skipped++;
        send({
          file: path.basename(filePath),
          filePath,
          status: 'skipped',
        });
        continue;
      }

      send({
        file: path.basename(filePath),
        filePath,
        status: 'processing',
      });

      let thumbPath = null;
      try {
        thumbPath = await extractFrame(filePath, settings.ffmpegPath, settings.framePosition);
        await setIconViaHelper(filePath, thumbPath);
        success++;
        send({
          file: path.basename(filePath),
          filePath,
          status: 'done',
        });
      } catch (err) {
        send({
          file: path.basename(filePath),
          filePath,
          status: 'error',
          message: err.message,
        });
      } finally {
        if (thumbPath) {
          fs.unlink(thumbPath, () => {});
        }
      }
    }

    return { success, skipped, total: files.length };
  });

  ipcMain.handle('settings:get', () => ({ ...settings }));

  ipcMain.handle('settings:set', (event, newSettings) => {
    settings = { ...settings, ...newSettings };
    saveSettings();
    return { ...settings };
  });
}

module.exports = { setupIPC };
