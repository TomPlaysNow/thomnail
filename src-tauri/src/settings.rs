use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub ffmpeg_path: String,
    pub frame_position: String,
    pub recursive: bool,
    pub skip_processed: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            // Empty means FFmpeg is located on every run, see video::executables.
            ffmpeg_path: String::new(),
            frame_position: "50%".into(),
            recursive: false,
            skip_processed: false,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SettingsPatch {
    pub ffmpeg_path: Option<String>,
    pub frame_position: Option<String>,
    pub recursive: Option<bool>,
    pub skip_processed: Option<bool>,
}

pub fn frame_percentage(value: &str) -> Result<f64, String> {
    let percentage = value
        .trim()
        .trim_end_matches('%')
        .parse::<f64>()
        .map_err(|_| "Die Frame-Position muss zwischen 1 und 99 % liegen.".to_string())?;
    if !percentage.is_finite() || !(1.0..=99.0).contains(&percentage) {
        return Err("Die Frame-Position muss zwischen 1 und 99 % liegen.".into());
    }
    Ok(percentage / 100.0)
}

impl Settings {
    pub fn patched(&self, patch: SettingsPatch) -> Result<Self, String> {
        let mut next = self.clone();
        if let Some(value) = patch.ffmpeg_path {
            next.ffmpeg_path = value;
        }
        if let Some(value) = patch.frame_position {
            frame_percentage(&value)?;
            next.frame_position = value;
        }
        if let Some(value) = patch.recursive {
            next.recursive = value;
        }
        if let Some(value) = patch.skip_processed {
            next.skip_processed = value;
        }
        Ok(next)
    }
}

pub fn save(path: &Path, settings: &Settings) -> Result<(), String> {
    let parent = path.parent().ok_or("Ungültiger Einstellungspfad")?;
    std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    // Write in the same directory and atomically replace, including on Windows.
    let mut temporary = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    serde_json::to_writer_pretty(&mut temporary, settings).map_err(|e| e.to_string())?;
    temporary.persist(path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load(path: &Path, legacy_paths: &[PathBuf]) -> Result<Settings, String> {
    let source = std::iter::once(path)
        .chain(legacy_paths.iter().map(PathBuf::as_path))
        .find(|path| path.is_file());
    let settings = if let Some(source) = source {
        let settings: Settings =
            serde_json::from_slice(&std::fs::read(source).map_err(|e| e.to_string())?)
                .map_err(|e| format!("Einstellungen in {} sind ungültig: {e}", source.display()))?;
        frame_percentage(&settings.frame_position)?;
        settings
    } else {
        Settings::default()
    };
    if !path.exists() {
        save(path, &settings)?;
    }
    Ok(settings)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn frame_position_rejects_invalid_values() {
        assert_eq!(frame_percentage("50%").unwrap(), 0.5);
        assert_eq!(frame_percentage("1%").unwrap(), 0.01);
        for value in ["0%", "100%", "NaN", "inf", "", "abc", "-2%"] {
            assert!(frame_percentage(value).is_err(), "{value}");
        }
    }
    #[test]
    fn legacy_settings_migrate_and_new_settings_take_precedence() {
        let root = tempfile::tempdir().unwrap();
        let legacy = root.path().join("old/settings.json");
        let new = root.path().join("new/settings.json");
        let original = Settings {
            recursive: true,
            frame_position: "25%".into(),
            ..Settings::default()
        };
        save(&legacy, &original).unwrap();
        assert!(load(&new, std::slice::from_ref(&legacy)).unwrap().recursive);
        let changed = Settings {
            frame_position: "75%".into(),
            ..original
        };
        save(&new, &changed).unwrap();
        assert_eq!(load(&new, &[legacy]).unwrap().frame_position, "75%");
    }
}
