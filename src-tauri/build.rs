fn main() {
    println!("cargo:rerun-if-changed=../swift-helper/main.swift");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("macos") {
        let arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap();
        let swift_target = match arch.as_str() {
            "aarch64" => "arm64-apple-macosx11.0",
            "x86_64" => "x86_64-apple-macosx11.0",
            _ => panic!("Unsupported macOS architecture: {arch}"),
        };
        std::fs::create_dir_all("binaries").unwrap();
        let status = std::process::Command::new("xcrun")
            .args([
                "swiftc",
                "-O",
                "-target",
                swift_target,
                "../swift-helper/main.swift",
                "-o",
                "binaries/swift-helper",
            ])
            .status()
            .expect("Xcode Command Line Tools are required for the Finder icon helper");
        assert!(status.success(), "Swift helper build failed");
    }
    tauri_build::build();
}
