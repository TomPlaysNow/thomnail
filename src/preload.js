const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  // File.path was removed in Electron 32; webUtils is the replacement
  getPathForFile: (file) => webUtils.getPathForFile(file),
  isDirectory: (p) => ipcRenderer.invoke('fs:isDirectory', p),
  processFolder: (folderPath) => ipcRenderer.invoke('process:start', folderPath),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (s) => ipcRenderer.invoke('settings:set', s),
  onProgress: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('process:progress', handler);
    return handler;
  },
  removeProgressListener: (handler) => {
    ipcRenderer.removeListener('process:progress', handler);
  },
});

