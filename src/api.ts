import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import type { AppInfo, FileProgress, Settings, Summary } from './types';

export const api = {
  openFolder: () => open({ directory: true, multiple: false, title: 'Video-Ordner auswählen' }),
  isDirectory: (path: string) => invoke<boolean>('is_directory', { path }),
  getAppInfo: () => invoke<AppInfo>('get_app_info'),
  getSettings: () => invoke<Settings>('get_settings'),
  setSettings: (patch: Partial<Settings>) => invoke<Settings>('set_settings', { patch }),
  processFolder: (folderPath: string) => invoke<Summary>('process_folder', { folderPath }),
  onProgress: (callback: (progress: FileProgress) => void) =>
    listen<FileProgress>('process-progress', ({ payload }) => callback(payload)),
};
export const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);
