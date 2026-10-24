#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod error;
mod platform;
mod settings;
mod video;

use error::AppError;
use serde::Serialize;
use settings::{Settings, SettingsPatch};
use std::{
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
};
use tauri::{Emitter, Manager, State};

struct AppState {
    settings: Mutex<Settings>,
    settings_path: PathBuf,
    running: Arc<AtomicBool>,
    cancel: Arc<AtomicBool>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct FileEntry {
    file: String,
    file_path: String,
}
/// The list is sent once; progress then refers to files by index, which keeps
/// large folders cheap to update.
#[derive(Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum ProcessEvent {
    Files {
        files: Vec<FileEntry>,
    },
    Progress {
        index: usize,
        status: &'static str,
        #[serde(skip_serializing_if = "Option::is_none")]
        error: Option<AppError>,
    },
}
#[derive(Debug, Default, Serialize)]
struct Summary {
    success: usize,
    skipped: usize,
    total: usize,
    /// Files after the cancellation point were not touched.
    cancelled: bool,
}

fn process(
    folder: &Path,
    settings: &Settings,
    helper: &Path,
    cancel: &AtomicBool,
    send: impl Fn(ProcessEvent),
) -> Result<Summary, AppError> {
    platform::ensure_supported()?;
    let files = video::video_files(folder, settings.recursive)?;
    if files.is_empty() {
        return Ok(Summary::default());
    }
    video::check_tools(settings)?;
    if !helper.is_file() {
        return Err(AppError::with("helperMissing", helper.display()));
    }
    send(ProcessEvent::Files {
        files: files
            .iter()
            .map(|path| FileEntry {
                file: path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .into_owned(),
                file_path: path.to_string_lossy().into_owned(),
            })
            .collect(),
    });
    let progress = |index, status, error| send(ProcessEvent::Progress { index, status, error });
    let mut summary = Summary {
        total: files.len(),
        ..Summary::default()
    };
    // RAII cleans up every generated image, including failed extractions.
    let temporary = tempfile::tempdir().map_err(AppError::wrap("tempFolder"))?;
    for (index, file) in files.iter().enumerate() {
        // Checked between files: a single file never takes long, and stopping
        // FFmpeg halfway would only leave a half-written temporary image.
        if cancel.load(Ordering::SeqCst) {
            summary.cancelled = true;
            break;
        }
        if settings.skip_processed && platform::has_custom_icon(file) {
            summary.skipped += 1;
            progress(index, "skipped", None);
            continue;
        }
        progress(index, "processing", None);
        let image = temporary.path().join(format!("frame-{index}.png"));
        let result = video::extract_frame(file, &image, settings)
            .and_then(|_| platform::set_icon(helper, file, &image));
        let _ = std::fs::remove_file(&image);
        match result {
            Ok(()) => {
                summary.success += 1;
                progress(index, "done", None);
            }
            Err(error) => progress(index, "error", Some(error)),
        }
    }
    Ok(summary)
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<Settings, AppError> {
    state
        .settings
        .lock()
        .map(|s| s.clone())
        .map_err(AppError::wrap("internal"))
}
#[tauri::command]
fn set_settings(patch: SettingsPatch, state: State<'_, AppState>) -> Result<Settings, AppError> {
    let mut settings = state.settings.lock().map_err(AppError::wrap("internal"))?;
    let next = settings.patched(patch)?;
    settings::save(&state.settings_path, &next).map_err(AppError::wrap("settingsSave"))?;
    *settings = next.clone();
    Ok(next)
}
#[tauri::command]
fn is_directory(path: String) -> bool {
    Path::new(&path).is_dir()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    version: &'static str,
    platform: &'static str,
    supports_icons: bool,
}
#[tauri::command]
fn get_app_info() -> AppInfo {
    AppInfo {
        version: env!("CARGO_PKG_VERSION"),
        platform: std::env::consts::OS,
        supports_icons: platform::SUPPORTS_ICONS,
    }
}

struct RunningGuard(Arc<AtomicBool>);
impl Drop for RunningGuard {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

#[tauri::command]
async fn process_folder(
    folder_path: String,
    window: tauri::WebviewWindow,
    state: State<'_, AppState>,
) -> Result<Summary, AppError> {
    platform::ensure_supported()?;
    let settings = get_settings(state.clone())?;
    let resources = window
        .app_handle()
        .path()
        .resource_dir()
        .map_err(AppError::wrap("internal"))?;
    let helper = if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries/swift-helper")
    } else {
        platform::helper_path(&resources)
    };
    if state.running.swap(true, Ordering::SeqCst) {
        return Err(AppError::new("alreadyRunning"));
    }
    let guard = RunningGuard(Arc::clone(&state.running));
    state.cancel.store(false, Ordering::SeqCst);
    let cancel = Arc::clone(&state.cancel);
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = guard;
        process(Path::new(&folder_path), &settings, &helper, &cancel, |event| {
            let _ = window.emit("process-event", event);
        })
    })
    .await
    .map_err(AppError::wrap("internal"))?
}
#[tauri::command]
fn cancel_processing(state: State<'_, AppState>) {
    state.cancel.store(true, Ordering::SeqCst);
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let settings_path = app.path().app_config_dir()?.join("settings.json");
            let legacy = app.path().config_dir()?;
            let legacy_paths = [
                legacy.join("Thomnail/settings.json"),
                legacy.join("thomnail/settings.json"),
                legacy.join("videothumb/settings.json"),
            ];
            let settings =
                settings::load(&settings_path, &legacy_paths).unwrap_or_else(|message| {
                    eprintln!("Settings could not be loaded: {message}");
                    Settings::default()
                });
            app.manage(AppState {
                settings: Mutex::new(settings),
                settings_path,
                running: Arc::new(AtomicBool::new(false)),
                cancel: Arc::new(AtomicBool::new(false)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            get_settings,
            set_settings,
            is_directory,
            process_folder,
            cancel_processing
        ])
        .run(tauri::generate_context!())
        .expect("Thomnail konnte nicht gestartet werden");
}

#[cfg(test)]
mod tests {
    use super::*;
    static RUN: AtomicBool = AtomicBool::new(false);
    fn status(event: &ProcessEvent) -> &'static str {
        match event {
            ProcessEvent::Files { .. } => "files",
            ProcessEvent::Progress { status, .. } => status,
        }
    }
    fn mp4(path: &Path) {
        video::checked_output(
            video::command("ffmpeg")
                .args(["-nostdin", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=blue:s=240x120:d=1", "-c:v", "mpeg4"])
                .arg(path),
            "ffmpeg",
        )
        .unwrap();
    }
    #[test]
    #[cfg(target_os = "macos")]
    fn missing_ffmpeg_stops_before_any_file_is_touched() {
        let directory = tempfile::tempdir().unwrap();
        std::fs::write(directory.path().join("clip.mp4"), b"").unwrap();
        let settings = Settings {
            ffmpeg_path: "/missing/ffmpeg".into(),
            ..Settings::default()
        };
        let events = Mutex::new(Vec::new());
        let error = process(directory.path(), &settings, Path::new("/missing/helper"), &RUN, |event| {
            events.lock().unwrap().push(status(&event))
        })
        .unwrap_err();
        assert_eq!(error.code, "ffmpegMissing");
        assert!(events.lock().unwrap().is_empty());
    }
    #[test]
    #[cfg(target_os = "macos")]
    #[ignore = "end-to-end processing requires FFmpeg and the Swift helper"]
    fn cancelling_stops_before_the_next_file() {
        let directory = tempfile::tempdir().unwrap();
        for name in ["a.mp4", "b.mp4", "c.mp4"] {
            mp4(&directory.path().join(name));
        }
        let helper = Path::new(env!("CARGO_MANIFEST_DIR")).join("binaries/swift-helper");
        let cancel = AtomicBool::new(false);
        let events = Mutex::new(Vec::new());
        let result = process(directory.path(), &Settings::default(), &helper, &cancel, |event| {
            let status = status(&event);
            // Cancel while the first file is being finished.
            if status == "done" {
                cancel.store(true, Ordering::SeqCst);
            }
            events.lock().unwrap().push(status);
        })
        .unwrap();
        assert_eq!((result.success, result.total, result.cancelled), (1, 3, true));
        assert_eq!(*events.lock().unwrap(), ["files", "processing", "done"]);
        assert!(!platform::has_custom_icon(&directory.path().join("b.mp4")));
    }
    #[test]
    #[cfg(target_os = "macos")]
    #[ignore = "end-to-end processing requires FFmpeg and the Swift helper"]
    fn process_and_skip_existing_icons_with_progress_events() {
        let directory = tempfile::tempdir().unwrap();
        let video = directory.path().join("test clip.mp4");
        mp4(&video);
        let original = std::fs::read(&video).unwrap();
        let helper = Path::new(env!("CARGO_MANIFEST_DIR")).join("binaries/swift-helper");
        let settings = Settings {
            ffmpeg_path: "ffmpeg".into(),
            skip_processed: true,
            ..Settings::default()
        };
        let events = Mutex::new(Vec::new());
        let result = process(directory.path(), &settings, &helper, &RUN, |event| {
            events.lock().unwrap().push(status(&event))
        })
        .unwrap();
        assert_eq!((result.success, result.skipped, result.total, result.cancelled), (1, 0, 1, false));
        assert_eq!(*events.lock().unwrap(), ["files", "processing", "done"]);
        assert_eq!(std::fs::read(&video).unwrap(), original);
        assert_eq!(
            process(directory.path(), &settings, &helper, &RUN, |_| {})
                .unwrap()
                .skipped,
            1
        );
        std::fs::write(directory.path().join("broken.mov"), b"bad video").unwrap();
        let failed = process(directory.path(), &settings, &helper, &RUN, |_| {}).unwrap();
        assert_eq!((failed.success, failed.skipped, failed.total), (0, 1, 2));
        assert_eq!(
            process(
                tempfile::tempdir().unwrap().path(),
                &settings,
                &helper,
                &RUN,
                |_| {}
            )
            .unwrap()
            .total,
            0
        );
    }
}
