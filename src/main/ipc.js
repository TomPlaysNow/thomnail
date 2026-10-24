const { ipcMain, dialog, app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { getVideoFiles, extractFrame } = require('./video');

const DEFAULT_FFMPEG_PATH = '/opt/local/bin/ffmpeg';
const DEFAULT_FRAME_POSITION = '50%';

// In-memory settings (overridable via IPC)
let settings = {
  ffmpegPath: DEFAULT_FFMPEG_PATH,
  framePosition: DEFAULT_FRAME_POSITION,
  recursive: false,
  skipProcessed: false,
};

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
      return { success: 0, total: 0 };
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

    for (const filePath of files) {
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

    return { success, total: files.length };
  });

  ipcMain.handle('settings:get', () => ({ ...settings }));

  ipcMain.handle('settings:set', (event, newSettings) => {
    settings = { ...settings, ...newSettings };
    return { ...settings };
  });
}

module.exports = { setupIPC };
