export interface Settings {
  ffmpegPath: string;
  framePosition: string;
  recursive: boolean;
  skipProcessed: boolean;
  language: string;
}
/** Mirrors AppError in src-tauri/src/error.rs; the text comes from src/i18n.ts. */
export interface AppError { code: string; detail?: string }
export type FileStatus = 'pending' | 'processing' | 'done' | 'skipped' | 'error' | 'cancelled';
export interface FileItem {
  file: string;
  filePath: string;
  status: FileStatus;
  error?: AppError;
}
/** Mirrors ProcessEvent in src-tauri/src/main.rs: the list once, then progress by index. */
export type ProcessEvent =
  | { kind: 'files'; files: { file: string; filePath: string }[] }
  | { kind: 'progress'; index: number; status: FileStatus; error?: AppError };
export interface Summary { success: number; skipped: number; total: number; cancelled: boolean }
export interface AppInfo { version: string; platform: string; supportsIcons: boolean }
