#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod platform;
mod settings;
mod video;

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
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct FileProgress {
    file: String,
    file_path: String,
    status: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
}
#[derive(Debug, Default, Serialize)]
struct Summary {
    success: usize,
    skipped: usize,
    total: usize,
}

fn process(
    folder: &Path,
    settings: &Settings,
    helper: &Path,
    send: impl Fn(FileProgress),
) -> Result<Summary, String> {
    platform::ensure_supported()?;
    let files = video::video_files(folder, settings.recursive)?;
    if files.is_empty() {
        return Ok(Summary::default());
    }
    video::check_tools(settings)?;
    if !helper.is_file() {
        return Err("Der Finder-Icon-Helfer fehlt im App-Paket. Bitte Thomnail neu installieren.".into());
    }
    let progress = |path: &Path, status, message| {
        send(FileProgress {
            file: path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into_owned(),
            file_path: path.to_string_lossy().into_owned(),
            status,
            message,
        })
    };
    let mut summary = Summary {
        success: 0,
        skipped: 0,
        total: files.len(),
    };
    for file in &files {
        progress(file, "pending", None);
    }
    // RAII cleans up every generated image, including failed extractions.
    let temporary = tempfile::tempdir().map_err(|e| format!("Temporärer Ordner: {e}"))?;
    for (index, file) in files.iter().enumerate() {
        if settings.skip_processed && platform::has_custom_icon(file) {
            summary.skipped += 1;
            progress(file, "skipped", None);
            continue;
        }
        progress(file, "processing", None);
        let image = temporary.path().join(format!("frame-{index}.png"));
        let result = video::extract_frame(file, &image, settings)
            .and_then(|_| platform::set_icon(helper, file, &image));
        let _ = std::fs::remove_file(&image);
        match result {
            Ok(()) => {
                summary.success += 1;
                progress(file, "done", None);
            }
            Err(message) => progress(file, "error", Some(message)),
        }
    }
    Ok(summary)
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<Settings, String> {
    state
        .settings
        .lock()
        .map(|s| s.clone())
        .map_err(|e| e.to_string())
}
#[tauri::command]
fn set_settings(patch: SettingsPatch, state: State<'_, AppState>) -> Result<Settings, String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    let next = settings.patched(patch)?;
    settings::save(&state.settings_path, &next)?;
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
) -> Result<Summary, String> {
    platform::ensure_supported()?;
    let settings = get_settings(state.clone())?;
    let resources = window
        .app_handle()
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?;
    let helper = if cfg!(debug_assertions) {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("binaries/swift-helper")
    } else {
        platform::helper_path(&resources)
    };
    if state.running.swap(true, Ordering::SeqCst) {
        return Err("Eine Verarbeitung läuft bereits.".into());
    }
    let guard = RunningGuard(Arc::clone(&state.running));
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = guard;
        process(Path::new(&folder_path), &settings, &helper, |progress| {
            let _ = window.emit("process-progress", progress);
        })
    })
    .await
    .map_err(|e| e.to_string())?
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
                    eprintln!("Einstellungen konnten nicht geladen werden: {message}");
                    Settings::default()
                });
            app.manage(AppState {
                settings: Mutex::new(settings),
                settings_path,
                running: Arc::new(AtomicBool::new(false)),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_info,
            get_settings,
            set_settings,
            is_directory,
            process_folder
        ])
        .run(tauri::generate_context!())
        .expect("Thomnail konnte nicht gestartet werden");
}

#[cfg(test)]
mod tests {
    use super::*;
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
        let error = process(directory.path(), &settings, Path::new("/missing/helper"), |event| {
            events.lock().unwrap().push(event.status)
        })
        .unwrap_err();
        assert!(error.starts_with("FFmpeg wurde nicht gefunden"), "{error}");
        assert!(events.lock().unwrap().is_empty());
    }
    #[test]
    #[cfg(target_os = "macos")]
    #[ignore = "end-to-end processing requires FFmpeg and the Swift helper"]
    fn process_and_skip_existing_icons_with_progress_events() {
        let directory = tempfile::tempdir().unwrap();
        let video = directory.path().join("test clip.mp4");
        video::checked_output(
            video::command("ffmpeg")
                .args([
                    "-nostdin",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-f",
                    "lavfi",
                    "-i",
                    "color=c=blue:s=240x120:d=1",
                    "-c:v",
                    "mpeg4",
                ])
                .arg(&video),
            "ffmpeg",
        )
        .unwrap();
        let original = std::fs::read(&video).unwrap();
        let helper = Path::new(env!("CARGO_MANIFEST_DIR")).join("binaries/swift-helper");
        let settings = Settings {
            ffmpeg_path: "ffmpeg".into(),
            skip_processed: true,
            ..Settings::default()
        };
        let events = Mutex::new(Vec::new());
        let result = process(directory.path(), &settings, &helper, |event| {
            events.lock().unwrap().push(event.status)
        })
        .unwrap();
        assert_eq!((result.success, result.skipped, result.total), (1, 0, 1));
        assert_eq!(*events.lock().unwrap(), ["pending", "processing", "done"]);
        assert_eq!(std::fs::read(&video).unwrap(), original);
        assert_eq!(
            process(directory.path(), &settings, &helper, |_| {})
                .unwrap()
                .skipped,
            1
        );
        std::fs::write(directory.path().join("broken.mov"), b"bad video").unwrap();
        let failed = process(directory.path(), &settings, &helper, |_| {}).unwrap();
        assert_eq!((failed.success, failed.skipped, failed.total), (0, 1, 2));
        assert_eq!(
            process(
                tempfile::tempdir().unwrap().path(),
                &settings,
                &helper,
                |_| {}
            )
            .unwrap()
            .total,
            0
        );
    }
}
