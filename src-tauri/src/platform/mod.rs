//! Platform-specific file manager integration. Video scanning and extraction stay portable.
use crate::error::AppError;
use std::path::Path;

pub const SUPPORTS_ICONS: bool = cfg!(target_os = "macos");

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::{has_custom_icon, set_icon};

pub fn ensure_supported() -> Result<(), AppError> {
    if SUPPORTS_ICONS {
        Ok(())
    } else {
        Err(AppError::new("unsupportedPlatform"))
    }
}

#[cfg(not(target_os = "macos"))]
pub fn has_custom_icon(_path: &Path) -> bool {
    false
}
#[cfg(not(target_os = "macos"))]
pub fn set_icon(_helper: &Path, _video: &Path, _image: &Path) -> Result<(), AppError> {
    ensure_supported()
}

pub fn helper_path(resources: &Path) -> std::path::PathBuf {
    resources.join("swift-helper")
}
