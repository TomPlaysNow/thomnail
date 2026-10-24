# Plattformen nach dem Tauri-Umbau

Stand: 24. Oktober 2026, Version 1.4.0.

## Gemeinsamer Kern

React/TypeScript, Tauri-Kommandos, Einstellungen, Videosuche, FFmpeg/ffprobe und
Fortschrittsereignisse sind vom Betriebssystem getrennt. Der aktuelle Release
wird auf macOS gebaut und geprüft. Windows und Linux sind noch nicht getestet
und haben noch keine Dateimanager-Integration.

`src-tauri/src/platform/mod.rs` ist die Schnittstelle für `set_icon` und
`has_custom_icon`. Betriebssystemspezifischer Code wird mit `cfg(target_os)`
getrennt. `build.rs` baut den Swift-Helfer ausschließlich für macOS. Die gemeinsame
Tauri-Konfiguration enthält keine Swift-Ressource; diese kommt erst durch
`tauri.macos.conf.json` hinzu. Unter Windows werden FFmpeg-Prozesse ohne zusätzliches
Konsolenfenster gestartet und `ffprobe.exe` neben `ffmpeg.exe` gesucht.

## macOS: umgesetzt

Der vorhandene Swift-Helfer setzt das Icon über `NSWorkspace.setIcon`.
FinderInfo dient zur Erkennung. Die App benötigt separat installiertes FFmpeg.
Apple Silicon ist lokal geprüft; Intel-Builds müssen auf der Zielarchitektur
beziehungsweise mit passender Rust-Toolchain gesondert gebaut und geprüft werden.

## Linux: nächster sinnvoller Ausbau

Vor einer Umsetzung muss entschieden werden, ob Thomnail Dateimanager-Thumbnails
oder feste benutzerdefinierte Datei-Icons erzeugen soll. Eine mögliche Grundlage
für Vorschaubilder ist der [freedesktop Thumbnail Managing Standard](https://specifications.freedesktop.org/thumbnail/latest-single/).
Er beschreibt einen Cache unter `$XDG_CACHE_HOME/thumbnails` mit URI-basierten Namen,
PNG-Metadaten zur Originaldatei und Regeln zur Gültigkeit der Vorschau.

Das ist ein lokaler Vorschau-Cache und hat andere Eigenschaften als ein in
macOS-Dateimetadaten gespeichertes Finder-Icon. Verhalten beim Verschieben,
Cache-Leeren und in unterschiedlichen Dateimanagern muss gezielt geprüft werden.
Diese Funktion ist noch nicht implementiert.

## Windows: Explorer-Integration gesondert planen

Für Explorer-Vorschaubilder dokumentiert Microsoft
[Thumbnail Handler mit IThumbnailProvider](https://learn.microsoft.com/en-us/windows/win32/shell/building-thumbnail-providers).
Das benötigt eine eigene Shell-Integration und Registrierung. Vorher muss geprüft
werden, wie sich benutzergewählte Frames speichern und bereitstellen lassen und
wie bestehende Video-Thumbnail-Provider berücksichtigt werden.

Die macOS-Strategie lässt sich nicht direkt übernehmen. Eine solche Erweiterung
ist noch nicht implementiert; es werden weder Dateizuordnungen noch Registry-Einträge
für Videoformate verändert.

## Release-Schritte für neue Plattformen

1. Gewünschtes Verhalten für Icons bzw. Vorschaubilder konkret festlegen.
2. Plattform-Modul und zugehörige Integrationstests ergänzen.
3. Native Builds, Dialoge, Drag & Drop und Prozessaufrufe auf dem Zielsystem testen.
4. FFmpeg-Installation und -Erkennung auf dem Zielsystem festlegen.
5. Lizenzsammlung auf die neuen zielabhängigen Crates erweitern, Installer-Icons und
   Installations-/Deinstallationsablauf prüfen.

Bis dahin zeigt die Oberfläche auf diesen Betriebssystemen eine eindeutige Meldung
und startet keine vermeintlich erfolgreiche Icon-Verarbeitung.
