# Tauri-Release 1.4.0: lokale Verifikation

Stand: 24. Oktober 2026. Getestet auf macOS, Apple Silicon (arm64).

## Ergebnis

- App-Größe: 6,977,728 Bytes (6.98 MB).
- Bisheriger Electron-Build: rund 293,5 MB; Einsparung rund 97,6 %.
- ZIP-Größe: 1,774,362 Bytes (1.77 MB).
- Keine Electron-/Chromium-/Node.js-Laufzeit im neuen App-Bundle.
- FFmpeg/ffprobe bleiben separat installierte Voraussetzungen.

## Prüfungen

- TypeScript-Prüfung erfolgreich (`npm run check`).
- Release-App und ZIP erfolgreich gebaut (`npm run make`).
- Sieben Rust-Tests einschließlich aller drei Integrationstests erfolgreich
  (`cargo test --manifest-path src-tauri/Cargo.toml -- --include-ignored`).
- Clippy für alle Targets des lokalen Builds ohne Warnungen erfolgreich.
- Integrationstests mit temporären Videos: echte Frame-Erzeugung in 320 × 320,
  Pfade mit Leerzeichen, Finder-Icon setzen und erkennen, unveränderter Videoinhalt,
  Überspringen vorhandener Icons, ungültige Videos, fehlende Programme, leere Ordner,
  Fortschrittsereignisse, rekursive Suche ohne Symlink-Schleifen, Einstellungsmigration.
- Gepackte App manuell über UI-Automation geprüft: Start, nativer Ordnerdialog,
  echter Verarbeitungslauf bis „1 von 1 erfolgreich verarbeitet“, Einstellungsdialog.
- Ad-hoc-Signatur mit `codesign --verify --deep --strict` erfolgreich geprüft.
- Version 1.4.0 und Bundle-ID in Info.plist geprüft.
- App-Binary, Swift-Helfer sowie alle Lizenz-/Hinweisdateien im ZIP bytegleich mit der App.

Die abschließende kleine Überarbeitung stabilisiert den Drag-&-Drop-Listener und
wartet vor Verarbeitung/Einstellungsdialog auf ausstehende Speicherungen.
Der abschließende Release wurde danach neu gebaut; Typprüfung, alle Rust-Tests
und Clippy sind auch für diesen Stand erfolgreich. Ein tatsächlicher Drag-&-Drop-
Vorgang wurde nicht separat automatisiert geprüft.

## Artefakte

App: `src-tauri/target/release/bundle/macos/Thomnail.app`

ZIP: `out/tauri/Thomnail-darwin-arm64-1.4.0.zip`

SHA-256 des ZIP:
`e17e801c68a1d13e1fd809b5a09e035caff26db7934f44f811bf2c53950cd0cf`

Windows/Linux und Intel-macOS wurden nicht auf Zielhardware geprüft. Die
Dateimanager-Integration für Windows/Linux ist ausdrücklich noch nicht implementiert.
Der lokale Release ist nicht mit einer Apple Developer-ID signiert und nicht notarisiert.
