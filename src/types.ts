export interface Settings {
  ffmpegPath: string;
  framePosition: string;
  recursive: boolean;
  skipProcessed: boolean;
}
export type FileStatus = 'pending' | 'processing' | 'done' | 'skipped' | 'error';
export interface FileProgress {
  file: string;
  filePath: string;
  status: FileStatus;
  message?: string;
}
export interface Summary { success: number; skipped: number; total: number }
export interface AppInfo { version: string; platform: string; supportsIcons: boolean }
