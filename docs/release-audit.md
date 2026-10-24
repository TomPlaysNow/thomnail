# Prüfung vor Veröffentlichung

Datum: 24. Oktober 2026. Ausgangscommit: `58ec2f0`.

## Geheimnisse in der Git-Historie

- Repository ist kein flacher Clone; `origin` wurde vor der Prüfung abgerufen.
- Gitleaks 8.30.1 mit Standardregeln, `--all --full-history` und vollständig
  maskierter Ausgabe: 9 Commits, keine Treffer.
- Ergänzende Prüfung aller 72 unterschiedlichen Git-Blobs über alle Referenzen
  und Reflogs: keine privaten Schlüssel, Zugangsdaten in HTTP-URLs oder typischen
  Passwort-/API-Key-/Token-Zuweisungen gefunden. Keine verdächtigen Dateinamen
  für `.env`, private Schlüssel oder Zertifikatscontainer gefunden.
- Der maskierte Gitleaks-Bericht liegt lokal unter
  `/tmp/thomnail-audit/gitleaks-history.json` und wird nicht veröffentlicht.

Das ist eine musterbasierte Prüfung. Unbekannte Geheimnisformate und beliebige
private Inhalte werden dadurch nicht zuverlässig ausgeschlossen. Nicht lokal
vorhandene, unerreichbare GitHub-Objekte oder fremde Forks sind nicht abgedeckt.

## Fremdlizenzen im macOS-Download

Im alten ZIP für Version 1.0.0 fehlten separate Electron-/Chromium-Lizenzdateien.
Im bisherigen 1.2.0-App-Build lagen diese neben der App. Der ZIP-Maker nimmt nur
die App auf. Die React-Banner enthielten außerdem keinen vollständigen MIT-Text.

Das Packaging wurde korrigiert:

- Webpack sammelt vollständige LICENSE-/COPYING-/NOTICE-Dateien der eingebundenen
  npm-Pakete, einschließlich verschachtelter Abhängigkeiten und Loader-Runtimes.
  Für den erzeugten Webpack-Runtime-Code wird dessen Lizenz ebenfalls aufgenommen.
  Fehlt ein Lizenztext, bricht der Build ab.
- Die gesammelten Hinweise sowie die unveränderten Electron-/Chromium-Lizenztexte
  werden vor der Ad-hoc-Signierung in `Thomnail.app/Contents/Resources/` abgelegt.
- Die eigene MIT-Lizenz und der Lizenzhinweis zum App-Icon werden mitgeliefert.
- FFmpeg/ffprobe werden nicht mitgeliefert; die App verwendet eine separat
  installierte Version. Eine spätere Bündelung benötigt eine neue Prüfung.

Geprüfte npm-Komponenten im neuen Build:

| Komponente | Version | Lizenz |
| --- | --- | --- |
| async | 0.2.10 | MIT |
| css-loader (Runtime) | 6.11.0 | MIT |
| debug | 2.6.9 | MIT |
| electron-squirrel-startup | 1.0.1 | Apache-2.0 |
| fluent-ffmpeg | 2.1.3 | MIT |
| isexe | 2.0.0 | ISC |
| ms | 2.0.0 | MIT |
| react | 19.2.5 | MIT |
| react-dom | 19.2.5 | MIT |
| scheduler | 0.27.0 | MIT |
| style-loader (Runtime) | 3.3.4 | MIT |
| webpack (Runtime) | 5.106.2 | MIT |
| which | 1.3.1 | ISC |

Electron 41.3.0 wird mit seinem MIT-Lizenztext und der vollständigen mitgelieferten
Datei `LICENSES.chromium.html` für Chromium und weitere Runtime-Komponenten verteilt.

## Verifikation für Version 1.3.0

- `npm run make`: erfolgreich für macOS arm64, Version 1.3.0.
- Version und Bundle-ID in App und ZIP geprüft; aktualisierte Autorenangaben in beiden Lizenzdateien enthalten.
- Die fünf Lizenz-/Hinweisdateien im neuen ZIP sind bytegleich mit denen der App.
- Electron-/Chromium-Lizenzdateien sind bytegleich mit der installierten Electron-Distribution.
- Hinweise für alle zehn direkten und indirekten Produktionsabhängigkeiten sind enthalten.
- `codesign --verify --deep --strict`: erfolgreich (Ad-hoc-Signatur).
- `git diff --check`: erfolgreich.

Geprüftes Archiv:
`out/make/zip/darwin/arm64/Thomnail-darwin-arm64-1.3.0.zip`

SHA-256:
`96053ce081151dc6a7c39d44efe53dcd5e28a8e23339498784af06acf49f6051`

Diese technische Prüfung ersetzt keine umfassende Rechtsprüfung und enthält
keine Marken- oder Patentfreigabe. Bei Änderungen der Abhängigkeiten oder des
Packagings muss das tatsächlich verteilte Archiv erneut geprüft werden.
