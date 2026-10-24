export interface Settings {
  ffmpegPath: string;
  framePosition: string;
  recursive: boolean;
  skipProcessed: boolean;
  language: string;
}
/** Mirrors AppError in src-tauri/src/error.rs; the text comes from src/i18n.ts. */
export interface AppError { code: string; detail?: string }
export type FileStatus = 'pending' | 'processing' | 'done' | 'skipped' | 'error';
export interface FileProgress {
  file: string;
  filePath: string;
  status: FileStatus;
  error?: AppError;
}
export interface Summary { success: number; skipped: number; total: number }
export interface AppInfo { version: string; platform: string; supportsIcons: boolean }
