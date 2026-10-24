# VideoThumb

VideoThumb ist eine macOS-App, die aus jedem Video in einem Ordner einen Frame herausnimmt und ihn als **Finder-Icon** der Videodatei setzt. Im Finder siehst du dann statt des generischen Dateisymbols sofort, was im Video steckt – auch in Ordnern, Spotlight und auf externen Laufwerken, wo macOS selbst keine Vorschau erzeugt.

Aktuelle Version: **1.1.0**

## Funktionen

- **Ordner wählen** per Klick oder per **Drag & Drop** in das Fenster
- **Zeitpunkt wählbar**: Der Frame wird bei 1–99 % der Videolänge entnommen (Standard: 50 %)
- **Rekursiv**: Auf Wunsch werden auch alle Unterordner verarbeitet
- **Überspringen**: Dateien, die schon ein eigenes Icon haben, können ausgelassen werden
- **Fortschritt pro Datei** mit Status *Wartend*, *Verarbeite…*, *Fertig*, *Übersprungen* oder *Fehler* inklusive Fehlermeldung
- **Hoch- und Querformat**: Das Bild wird auf 320 × 320 Pixel eingepasst und mit schwarzen Balken aufgefüllt, nicht verzerrt
- **Einstellungen bleiben erhalten** über Neustarts hinweg

Unterstützte Formate: `.mp4`, `.mov`, `.mkv`, `.avi`

## Voraussetzungen

| Was | Version / Hinweis |
| --- | --- |
| macOS | Apple Silicon (arm64). Der Icon-Helfer nutzt `NSWorkspace` und läuft nur auf macOS. |
| ffmpeg + ffprobe | z. B. `brew install ffmpeg` oder `sudo port install ffmpeg` |
| Node.js + npm | nur zum Bauen aus dem Quellcode |
| Xcode Command Line Tools | nur, wenn du den Swift-Helfer neu bauen willst (`xcode-select --install`) |

VideoThumb sucht ffmpeg automatisch in dieser Reihenfolge:

1. `/opt/homebrew/bin/ffmpeg` (Homebrew, Apple Silicon)
2. `/usr/local/bin/ffmpeg` (Homebrew, Intel)
3. `/opt/local/bin/ffmpeg` (MacPorts)
4. `ffmpeg` aus dem `PATH`

`ffprobe` wird im selben Ordner wie ffmpeg erwartet. In den Einstellungen kannst du einen eigenen Pfad eintragen.

## Installation

### Aus dem Quellcode

```bash
git clone https://github.com/TomPlaysNow/videothumb.git
cd videothumb
npm install
npm run package
```

Die fertige App liegt danach in `out/videothumb-darwin-arm64/videothumb.app`. Zieh sie nach `/Programme` bzw. `/Applications`.

Für ein ZIP zum Weitergeben:

```bash
npm run make
```

Das Archiv landet in `out/make/zip/darwin/arm64/`.

> **Hinweis:** Die App ist nicht signiert. Beim ersten Start meldet macOS eventuell, dass sie nicht geöffnet werden kann. Dann im Finder mit Rechtsklick → *Öffnen* starten oder unter *Systemeinstellungen → Datenschutz & Sicherheit* freigeben.

## Bedienung

1. App starten.
2. Einen Ordner mit Videos in das Fenster ziehen oder auf das Feld klicken und einen Ordner auswählen.
3. Mit dem Schieberegler **Zeitpunkt** festlegen, an welcher Stelle des Videos der Frame genommen wird.
4. Auf **Icons setzen** klicken.
5. In der Liste siehst du den Status jeder Datei, darunter die Zusammenfassung.

Über das Zahnrad (⚙) oben rechts erreichst du die Einstellungen:

| Einstellung | Bedeutung |
| --- | --- |
| ffmpeg-Pfad | Pfad zur ffmpeg-Datei. Leer = ffmpeg aus dem `PATH`. |
| Frame-Position | Wie der Schieberegler im Hauptfenster |
| Unterordner rekursiv verarbeiten | Auch Videos in Unterordnern bearbeiten |
| Bereits verarbeitete Dateien überspringen | Dateien mit vorhandenem eigenem Icon auslassen |

Die Einstellungen werden in
`~/Library/Application Support/videothumb/settings.json` gespeichert.

### Icon wieder entfernen

Im Finder die Datei auswählen → `⌘ I` (Informationen) → oben links auf das kleine Icon klicken → `⌫` drücken.

## Wie es funktioniert

```
Renderer (React)  ──IPC──▶  Main-Prozess (Electron)
                              │
                              ├─ ffprobe: Videolänge ermitteln
                              ├─ ffmpeg:  Frame bei X % als PNG (320×320) ins Temp-Verzeichnis
                              ├─ swift-helper: PNG per NSWorkspace.setIcon als Datei-Icon setzen
                              └─ Temp-PNG löschen
```

Ob eine Datei schon ein eigenes Icon hat, erkennt VideoThumb am Flag `kHasCustomIcon` im erweiterten Attribut `com.apple.FinderInfo`.

Das Icon wird in der Datei selbst gespeichert (als Resource Fork). Das Video wird dabei **nicht** verändert. Auf Datenträgern ohne Unterstützung für erweiterte Attribute (z. B. manche FAT32- oder Netzlaufwerke) kann das Setzen fehlschlagen oder das Icon beim Kopieren verloren gehen.

## Projektstruktur

```
videothumb/
├── src/
│   ├── main.js              # Electron-Einstieg, Fenster, Über-Fenster
│   ├── main/
│   │   ├── ipc.js           # IPC-Handler, Einstellungen, Ablauf der Verarbeitung
│   │   └── video.js         # Videosuche und Frame-Extraktion mit ffmpeg
│   ├── preload.js           # Sichere Brücke zwischen Renderer und Main (window.api)
│   ├── renderer.js          # React-Einstieg
│   ├── renderer/            # React-Komponenten (App, DropZone, FileList, Progress, Settings)
│   ├── index.html
│   └── index.css
├── swift-helper/
│   ├── main.swift           # Kommandozeilen-Helfer: setzt ein Bild als Datei-Icon
│   └── build.sh             # Baut den Helfer nach resources/swift-helper
├── resources/
│   └── swift-helper         # Kompilierter Helfer (arm64), wird in die App gepackt
├── forge.config.js          # Electron Forge: Packaging, Maker, Fuses
└── webpack.*.config.js      # Webpack-Konfiguration für Main und Renderer
```

## Entwicklung

```bash
npm start
```

startet die App im Entwicklungsmodus mit automatischem Neuladen. Die DevTools öffnen sich dabei automatisch, in der gepackten App nicht.

### Swift-Helfer neu bauen

Nur nötig, wenn du `swift-helper/main.swift` änderst:

```bash
./swift-helper/build.sh
```

Der Helfer lässt sich auch direkt testen:

```bash
resources/swift-helper /pfad/zum/video.mp4 /pfad/zum/bild.png
```

### Verfügbare Skripte

| Befehl | Zweck |
| --- | --- |
| `npm start` | App im Entwicklungsmodus starten |
| `npm run package` | App als `.app` bauen |
| `npm run make` | Verteilbares ZIP erstellen |

## Fehlerbehebung

| Problem | Lösung |
| --- | --- |
| Alle Dateien zeigen *Fehler* mit „Cannot find ffmpeg“ o. ä. | ffmpeg installieren oder den Pfad in den Einstellungen korrigieren |
| Icon erscheint nicht sofort im Finder | Finder-Fenster schließen und neu öffnen; notfalls `killall Finder` |
| „setIcon failed“ | Prüfen, ob du Schreibrechte für die Datei hast und der Datenträger erweiterte Attribute unterstützt |
| App lässt sich nicht öffnen | Siehe Hinweis zur fehlenden Signatur unter *Installation* |

## Änderungen

### 1.1.0

- Drag & Drop von Ordnern funktioniert wieder
- „Bereits verarbeitete Dateien überspringen“ ist jetzt wirksam
- Einstellungen werden gespeichert
- ffmpeg wird automatisch gefunden (Homebrew und MacPorts)
- Absturz beim erneuten Öffnen des Fensters über das Dock behoben
- Ausführliches Über-Fenster
- DevTools nur noch im Entwicklungsmodus

### 1.0.0

- Erste Version

## Lizenz

MIT © 2026 Tom
