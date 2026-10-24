# Thomnail

Thomnail von **TomPlaysNow** setzt einen Video-Frame als Finder-Icon einer Videodatei.
Version **1.4.0** verwendet **Tauri 2, Rust und React/TypeScript**. Die App nutzt die
vorhandene System-WebView und liefert keinen eigenen Chromium-/Node.js-Unterbau mehr mit.

## Funktionen

- Ordner per Dialog oder Drag & Drop auswählen
- Frame-Position zwischen 1 und 99 % wählen (Standard: 50 %)
- Optional Unterordner verarbeiten und Dateien mit eigenem Finder-Icon überspringen
- Fortschritt, Dateifehler und Zusammenfassung anzeigen
- Hoch- und Querformat unverzerrt in 320 × 320 Pixel einpassen
- Einstellungen speichern; vorhandene Electron-/VideoThumb-Einstellungen übernehmen

Formate: `.mp4`, `.mov`, `.mkv`, `.avi`.

## Plattformen

**Die fertige Version unterstützt aktuell macOS.** Der Rust-Kern und die Oberfläche
sind plattformübergreifend aufgebaut. Die macOS-Integration liegt getrennt in
`src-tauri/src/platform/macos.rs`; der kleine Swift-Helfer nutzt `NSWorkspace.setIcon`.

Windows und Linux benötigen eine eigene Integration in Explorer bzw. den jeweiligen
Dateimanager. Sie sind noch **keine fertigen Produktversionen**. Auf diesen Plattformen
ist „Icons setzen“ deaktiviert und der Rust-Kern gibt eine klare Meldung zurück.
Die gemeinsame Videosuche und Frame-Extraktion können wiederverwendet werden.
Siehe [Plattformplanung](docs/platforms.md).

## Voraussetzungen

Für die Nutzung:

- macOS 11 oder neuer; der lokal gebaute Release entspricht der Architektur des Macs
- Separat installierte Programme **ffmpeg und ffprobe**, zum Beispiel über Homebrew
  (`brew install ffmpeg`) oder MacPorts (`sudo port install ffmpeg`)

Zum Bauen zusätzlich:

- Node.js 22.12 oder neuer und npm
- Rust 1.90 oder neuer mit Cargo; empfohlen wird eine aktuelle stabile Toolchain
- Xcode Command Line Tools (`xcode-select --install`)

Thomnail sucht FFmpeg unter `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`
und anschließend im `PATH`. In den Einstellungen kann ein eigener Pfad stehen.
`ffprobe` muss neben dem ausgewählten `ffmpeg` liegen. Beide werden ohne Shell und
mit getrennten Argumenten gestartet; Dateipfade mit Leerzeichen werden unterstützt.

## Bauen und starten

```bash
npm ci
npm start
```

Das startet Tauri mit dem Vite-Entwicklungsserver. Der Swift-Helfer wird auf macOS
automatisch für die Zielarchitektur gebaut.

Für eine fertige macOS-App:

```bash
npm run package
```

Ergebnis: `src-tauri/target/release/bundle/macos/Thomnail.app`.
Die App kann nach `/Applications` gezogen werden.

Für ein ZIP zum Weitergeben:

```bash
npm run make
```

Ergebnis: `out/tauri/Thomnail-darwin-<arch>-1.4.0.zip`.
Die früheren Electron-Builds unter `out/Thomnail-darwin-arm64` werden nicht verändert.

Die lokale App ist ad-hoc signiert. Eine Apple Developer-ID-Signierung und
Notarisierung sind damit nicht verbunden. Für eine öffentliche, notarisiert
verteilte Version muss das Signing separat eingerichtet werden.

## Bedienung und Einstellungen

1. Einen Video-Ordner auswählen oder in das Fenster ziehen.
2. Den Zeitpunkt des Frames mit dem Schieberegler festlegen.
3. Optional über das Zahnrad Unterordner und Überspringen vorhandener Icons einstellen.
4. **Icons setzen** starten und den Fortschritt verfolgen.

Die Einstellungen liegen unter macOS jetzt in
`~/Library/Application Support/io.github.tomplaysnow.thomnail/settings.json`.
Beim ersten Start werden sie aus `Thomnail`, `thomnail` oder `videothumb` im selben
Application-Support-Ordner übernommen. Die bisherigen Dateien bleiben erhalten.
Änderungen werden atomar gespeichert; die laufende Verarbeitung nutzt einen festen
Schnappschuss der Einstellungen.

Ein Icon entfernen: Datei im Finder auswählen → `⌘ I` → das kleine Icon oben links
anklicken → `⌫`.

## Verarbeitung

```text
React/TypeScript → Tauri-Kommandos → Rust
                                    ├─ Videos suchen
                                    ├─ ffprobe: Videolänge ermitteln
                                    ├─ ffmpeg: Frame als PNG erzeugen
                                    ├─ Plattform-Modul: Finder-Icon setzen
                                    └─ temporäre Bilder aufräumen
```

Die Videodaten bleiben unverändert. Das eigene Finder-Icon wird über macOS-Metadaten
(Resource Fork und FinderInfo) gespeichert. Das Flag `kHasCustomIcon` dient zum
Erkennen bereits verarbeiteter Dateien. Dateisysteme und Netzwerkfreigaben müssen
diese Metadaten unterstützen; beim Kopieren können sie verloren gehen.

## Projektstruktur

```text
src/
  api.ts                  Tauri-Brücke und typisierte Ereignisse
  types.ts                Gemeinsame Frontend-Typen
  renderer.tsx            React-Einstieg
  renderer/               Oberfläche
src-tauri/
  src/main.rs             App, Kommandos, Ablauf und Fortschritt
  src/settings.rs         Speicherung, Validierung und Migration
  src/video.rs            Plattformübergreifende Videosuche und FFmpeg-Aufrufe
  src/platform/           Dateimanager-Integration je Betriebssystem
  build.rs                Baut den Swift-Helfer nur auf macOS
  tauri.conf.json         Gemeinsame App-Konfiguration
  tauri.macos.conf.json   macOS-Helfer und Signierung
swift-helper/main.swift   Finder-Icon-Helfer
build/                    Lizenzsammlung und ZIP-Erstellung
resources/                App-Icon und zusätzliche Lizenztexte
```

## Prüfungen

```bash
npm run check
npm test
cargo test --manifest-path src-tauri/Cargo.toml -- --ignored
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
```

Die separat gestarteten Integrationstests benötigen FFmpeg/ffprobe und auf macOS
den automatisch gebauten Swift-Helfer. Sie arbeiten ausschließlich mit temporären
Dateien. Geprüft werden reale Frame-Extraktion, Finder-Icons, unveränderte Videodaten,
Überspringen, Fehlerfälle und Fortschrittsereignisse.

## Änderungen

### 1.4.0

- Electron durch Tauri und Rust ersetzt; React-Oberfläche auf TypeScript umgestellt
- Keine gebündelte Chromium-/Node.js-Laufzeit mehr
- Dateimanager-Integration vom portablen Verarbeitungskern getrennt
- Bestehende Einstellungen übernommen; Eingaben validiert und atomar gespeichert
- Native Tauri-Ordnerauswahl und Drag & Drop
- Fortschrittsbalken berücksichtigt auch übersprungene und fehlerhafte Dateien
- Vollständige Lizenztexte der neuen npm-/Rust-Abhängigkeiten werden mitgeliefert

### 1.3.0

- Autorenangabe TomPlaysNow, vollständige Fremdlizenztexte im Electron-Build
- Programmcode unter MIT und App-Icon unter CC BY 4.0 dokumentiert

### 1.2.0

- Neuer Name Thomnail (zuvor VideoThumb) und Migration der Einstellungen

## Lizenz

Programmcode: [MIT](LICENSE), © 2026 Tom (TomPlaysNow).
App-Icon: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), siehe
[ICON-LICENSE.md](resources/ICON-LICENSE.md).

Der Build sammelt vollständige Lizenz-/Hinweisdateien der npm-Produktionsabhängigkeiten
und der aufgelösten Rust-Abhängigkeiten einschließlich Build-Werkzeugen und
Rust-Runtime. Sie liegen in `Thomnail.app/Contents/Resources/licenses/`.
Die Rust-Hinweise enthalten Links zu den unveränderten Quellpaketen. Einige Crates
liefern ihre Lizenztexte nicht im Crate-Archiv mit; für die gesperrten Versionen
liegen deshalb Texte aus den jeweiligen Quell-Repositories unter
`resources/license-overrides/`, mit Herkunftsnachweisen in `sources.json`.
Fehlt ein vollständiger Lizenztext, bricht der Release-Build ab.
FFmpeg und ffprobe werden weiterhin separat installiert und nicht mitgeliefert.
