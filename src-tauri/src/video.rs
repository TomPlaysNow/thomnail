use crate::settings::{frame_percentage, Settings};
use std::{
    path::{Path, PathBuf},
    process::{Command, Output},
};

pub fn video_files(folder: &Path, recursive: bool) -> Result<Vec<PathBuf>, String> {
    if !folder.is_dir() {
        return Err("Bitte einen vorhandenen Ordner auswählen.".into());
    }
    let depth = if recursive { usize::MAX } else { 1 };
    let mut files = Vec::new();
    for entry in walkdir::WalkDir::new(folder)
        .follow_links(false)
        .max_depth(depth)
        .min_depth(1)
    {
        let entry = entry.map_err(|e| format!("Ordner kann nicht gelesen werden: {e}"))?;
        if entry.file_type().is_file()
            && entry.path().extension().is_some_and(|ext| {
                matches!(
                    ext.to_string_lossy().to_ascii_lowercase().as_str(),
                    "mp4" | "mov" | "mkv" | "avi"
                )
            })
        {
            files.push(entry.into_path());
        }
    }
    files.sort();
    Ok(files)
}

pub fn command(program: impl AsRef<std::ffi::OsStr>) -> Command {
    let mut command = Command::new(program);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    // No child should inherit the application's stdin.
    command.stdin(std::process::Stdio::null());
    command
}

pub fn checked_output(command: &mut Command, name: &str) -> Result<Output, String> {
    let output = command
        .output()
        .map_err(|e| format!("{name} konnte nicht gestartet werden: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let message: String = stderr
            .chars()
            .rev()
            .take(2000)
            .collect::<String>()
            .chars()
            .rev()
            .collect();
        return Err(format!(
            "{name}: {}",
            if message.trim().is_empty() {
                output.status.to_string()
            } else {
                message.trim().to_string()
            }
        ));
    }
    Ok(output)
}

pub fn executables(settings: &Settings) -> (PathBuf, PathBuf) {
    let ffmpeg = if settings.ffmpeg_path.is_empty() {
        PathBuf::from("ffmpeg")
    } else {
        PathBuf::from(&settings.ffmpeg_path)
    };
    let probe_name = if cfg!(windows) {
        "ffprobe.exe"
    } else {
        "ffprobe"
    };
    let ffprobe = ffmpeg
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .map(|p| p.join(probe_name))
        .unwrap_or_else(|| PathBuf::from(probe_name));
    (ffmpeg, ffprobe)
}

pub fn extract_frame(video: &Path, image: &Path, settings: &Settings) -> Result<(), String> {
    let (ffmpeg, ffprobe) = executables(settings);
    let metadata = checked_output(
        command(ffprobe)
            .args([
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "json",
            ])
            .arg(video),
        "ffprobe",
    )?;
    let metadata: serde_json::Value = serde_json::from_slice(&metadata.stdout)
        .map_err(|e| format!("Ungültige Videodaten: {e}"))?;
    let duration = metadata["format"]["duration"]
        .as_str()
        .and_then(|value| value.parse::<f64>().ok())
        .filter(|value| value.is_finite() && *value > 0.0)
        .ok_or("Videolänge konnte nicht ermittelt werden.")?;
    let seek = (duration * frame_percentage(&settings.frame_position)?).to_string();
    checked_output(command(ffmpeg).args(["-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-ss", &seek, "-i"])
        .arg(video).args(["-frames:v", "1", "-vf", "scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=black"])
        .arg(image), "ffmpeg")?;
    if !image.is_file() {
        return Err("FFmpeg hat kein Vorschaubild erzeugt.".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn scan_is_recursive_only_when_requested_and_never_follows_links() {
        let root = tempfile::tempdir().unwrap();
        std::fs::create_dir(root.path().join("sub")).unwrap();
        for name in ["clip.MP4", "sub/movie.mkv", "note.txt"] {
            std::fs::write(root.path().join(name), b"").unwrap();
        }
        #[cfg(unix)]
        std::os::unix::fs::symlink(root.path(), root.path().join("sub/loop")).unwrap();
        assert_eq!(video_files(root.path(), false).unwrap().len(), 1);
        assert_eq!(video_files(root.path(), true).unwrap().len(), 2);
        assert!(video_files(&root.path().join("missing"), false).is_err());
    }
    #[test]
    fn probe_is_selected_beside_configured_ffmpeg() {
        let settings = Settings {
            ffmpeg_path: "/test folder/ffmpeg".into(),
            ..Settings::default()
        };
        assert_eq!(
            executables(&settings).1,
            PathBuf::from("/test folder").join(if cfg!(windows) {
                "ffprobe.exe"
            } else {
                "ffprobe"
            })
        );
    }
    #[test]
    #[ignore = "requires locally installed FFmpeg and ffprobe; run with --ignored"]
    fn real_ffmpeg_extracts_letterboxed_frame_from_path_with_spaces() {
        let root = tempfile::tempdir().unwrap();
        let video = root.path().join("test video.mp4");
        checked_output(
            command("ffmpeg")
                .args([
                    "-nostdin",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-f",
                    "lavfi",
                    "-i",
                    "color=c=red:s=120x240:d=1",
                    "-c:v",
                    "mpeg4",
                ])
                .arg(&video),
            "ffmpeg",
        )
        .unwrap();
        let image = root.path().join("frame.png");
        extract_frame(
            &video,
            &image,
            &Settings {
                ffmpeg_path: "ffmpeg".into(),
                ..Settings::default()
            },
        )
        .unwrap();
        let png = std::fs::read(image).unwrap();
        assert_eq!(&png[0..8], b"\x89PNG\r\n\x1a\n");
        assert_eq!(u32::from_be_bytes(png[16..20].try_into().unwrap()), 320);
        assert_eq!(u32::from_be_bytes(png[20..24].try_into().unwrap()), 320);
        // Missing binaries and invalid video files must report failures.
        assert!(extract_frame(
            &video,
            &root.path().join("bad.png"),
            &Settings {
                ffmpeg_path: "/missing/ffmpeg".into(),
                ..Settings::default()
            }
        )
        .is_err());
        std::fs::write(&video, b"not a video").unwrap();
        assert!(extract_frame(&video, &root.path().join("bad.png"), &Settings::default()).is_err());
    }
}
