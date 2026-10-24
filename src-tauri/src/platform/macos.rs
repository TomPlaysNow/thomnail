use crate::video::{checked_output, command, explained};
use std::path::Path;

pub fn has_custom_icon(path: &Path) -> bool {
    let Ok(output) = command("/usr/bin/xattr").args(["-px", "com.apple.FinderInfo"]).arg(path).output() else { return false };
    if !output.status.success() {
        return false;
    }
    String::from_utf8_lossy(&output.stdout)
        .split_whitespace()
        .nth(8)
        .and_then(|byte| u8::from_str_radix(byte, 16).ok())
        .is_some_and(|byte| byte & 0x04 != 0)
}

pub fn set_icon(helper: &Path, video: &Path, image: &Path) -> Result<(), String> {
    checked_output(command(helper).arg(video).arg(image), "Finder-Icon-Helfer").map_err(explained(
        "Das Finder-Icon konnte nicht gesetzt werden. Bitte prüfen, ob die Datei beschreibbar ist.",
    ))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    #[ignore = "sets an icon on a temporary file; requires built Swift helper"]
    fn finder_icon_is_set_and_detected() {
        let directory = tempfile::tempdir().unwrap();
        let video = directory.path().join("temporary video.mp4");
        std::fs::write(&video, b"unchanged video content").unwrap();
        assert!(!has_custom_icon(&video));
        let root = Path::new(env!("CARGO_MANIFEST_DIR"));
        set_icon(
            &root.join("binaries/swift-helper"),
            &video,
            &root.join("../resources/icon.png"),
        )
        .unwrap();
        assert!(has_custom_icon(&video));
        assert_eq!(std::fs::read(&video).unwrap(), b"unchanged video content");
    }
}
