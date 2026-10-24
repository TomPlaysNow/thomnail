# Aurora — vollständige Designvorlage für Figma

Diese Datei enthält alle notwendigen Designangaben direkt. Es müssen keine
lokalen Dateien, Repositories oder vorhandenen Figma-Seiten geöffnet werden.
Sie ist eine exportierte Momentaufnahme der Aurora-Referenz vom 24. Oktober 2026 (Version 0.2).

## Entwurfsauftrag

Erstelle auf Grundlage der folgenden Spezifikation einen bearbeitbaren
Aurora-Designvorschlag für Desktop-Apps von TomPlaysNow. Verwende deutsche
Beschriftungen, Auto Layout und wiederverwendbare Komponenten mit Varianten.
Lege Farben und Abstände als lokale Variablen oder Styles an.

Erstelle folgende Frames:

1. **Aurora — Designsystem:** Farbfelder mit Rollen und Hex-Werten, Typografie,
   Abstände, Panels, Primär- und Sekundärbuttons, Eingabefelder, Checkboxen,
   Regler, Statusmeldungen und Fokuszustände. Zeige Standard, Hover, Fokus und
   gedrückte, beschäftigte und deaktivierte Zustände. Die Vorlage definiert eine dunkle Darstellung.
2. **Thomnail — Hauptansicht (900 × 650 px):** Überschrift „Thomnail“, rechts ein
   Zahnrad für „Einstellungen“, große Ordner-Dropzone mit „Ordner hierher ziehen“
   und „oder klicken zum Auswählen“, darunter ein Regler mit „Frame bei 50 %“.
   Im Zustand mit gewähltem Ordner erscheint die Hauptaktion „Icons setzen“.
   Zeige einen kompakten Ordnerpfad. Footer: „Thomnail · TomPlaysNow“.
3. **Thomnail — Einstellungen:** Dialog über derselben Hauptansicht. Inhalt:
   „ffmpeg-Pfad“, Textfeld, Checkboxen „Unterordner rekursiv verarbeiten“ und
   „Bereits verarbeitete Dateien überspringen“, „Abbrechen“ und „Speichern“.
   Der Frame-Regler steht ausschließlich in der Hauptansicht.
4. **Thomnail — Verarbeitung und Fehlerdetails:** Fortschrittsbalken, kompakte
   Dateiliste mit den Status „Fertig“, „Verarbeite…“ und „Fehler“. Zeige einen
   Fehler einmal kompakt und einmal mit aufgeklapptem vollständigem Dateipfad
   und Meldung. Beispiel: „Vorschaubild konnte nicht erstellt werden. Die Datei
   ist beschädigt oder enthält kein lesbares Video.“
5. **Thomnail — schmales Fenster (600 × 550 px):** Zeige, wie dieselben Inhalte
   mit langen Dateinamen und Pfaden erreichbar bleiben.

Der einfache Ablauf lautet: Ordner wählen → Frame-Position einstellen → Icons
setzen. Die Gestaltung der Beispiel-App dient als Demonstration des gemeinsamen
Designs. Eine Sidebar oder zusätzliche Navigation ist für dieses Beispiel nicht
nötig. Die konkrete Struktur anderer Apps richtet sich nach deren Aufgabe.

Die folgenden Werte bilden die verbindliche Grundlage dieses Entwurfsauftrags.
Für einen ersten Entwurf sind keine externen Assets nötig; verwende einfache,
bearbeitbare Symbole. CSS-Beispiele beschreiben die Optik und sollen in Figma
mit Flächen, Verläufen und Effekten nachgebildet werden.


Ergänze in der Komponentenübersicht die festen Schriftrollen und Kontrollgrößen
sowie getrennte Beispiele für Hauptaktion, Fokus, Auswahl und Fortschritt.
Zeige außerdem leere Suche, Laden, Erfolg, Teilerfolg und ungültige Eingaben.
Wiederholen und Abbrechen nur als zusätzliche Funktionsvorschläge darstellen,
wenn ihre technische Unterstützung für die Beispiel-App nicht bestätigt ist.

---

# Aurora — Vorschlag für ein gemeinsames App-Design

Stand: 24. Oktober 2026 · Version 0.2 · Status: Designvorschlag mit festen Entwurfsstandards

Aurora soll als wiedererkennbare Gestaltung für die Apps von TomPlaysNow dienen:
nachtblaue Flächen, gut lesbare helle Schrift, Cyan für Aktionen und ein dezenter
Cyan-/Violettverlauf im Hintergrund. Der Stil stammt aus Schach-Comment und ist
bereits auf Thomnail übertragen. Dieses Dokument ist die übertragbare Referenz
für weitere Apps, unabhängig von Framework und Betriebssystem.

## Gestaltungsprinzipien

- Die Hauptaufgabe steht im Vordergrund. Kleine Werkzeuge dürfen aus einer
  einzigen Ansicht bestehen; zusätzliche Navigation braucht einen fachlichen Grund.
- Cyan markiert Aktionen, aktive Zustände und Tastaturfokus. Überschriften und
  längere Texte bleiben hell und neutral.
- Violett erscheint als Hintergrundlicht. Rosa oder violette Hauptbuttons gehören
  nicht zur hier festgehaltenen Richtung.
- Glaskanten und Schatten geben Panels Tiefe. Text- und Datenflächen sind dunkel
  und weitgehend deckend, damit der Hintergrund die Lesbarkeit nicht beeinflusst.
- Glow erscheint sparsam an aktiven oder fokussierten Elementen. Ruhende Panels
  bekommen eine feine Glanzkante und einen Schatten.
- Beschriftungen benennen die Wirkung konkret: etwa „Frame bei 50 %“, „Ordner
  wählen“ oder „Icons setzen“. Fortgeschrittene Einstellungen bleiben bei Bedarf
  hinter einem eindeutig beschrifteten Einstellungszugang.

## Farbpalette

| Rolle | Wert | Verwendung |
| --- | --- | --- |
| Hintergrund | `#030409` | Grundfläche |
| Dunkle Fläche | `#0a0d17` | Listen, Inhaltsflächen |
| Erhöhte Fläche | `#101526` | Karten, Reglergruppen, sekundäre Buttons |
| Haupttext | `#dfe6f5` | Überschriften, Inhalte und Werte |
| Sekundärtext | `#a7b2ca` | Hilfstexte und Zusatzinformationen |
| Cyan-Akzent | `#4be1ff` | Fokus, aktive Elemente, Fortschritt |
| Primärbutton | `#17bde0` | Hauptaktion |
| Primärbutton bei Hover | `#0fa3c4` | Zeiger über der Hauptaktion |
| Text auf Primärbutton | `#04222c` | Dunkle Buttonbeschriftung |
| Violett | `#8b7cff` | Hintergrundverlauf |
| Sichtbarer Eingaberand | `#62799a` | Eingabefelder und Reglerspur |
| Panelkante | `rgba(140, 190, 255, 0.22)` | Dekorative Karten- und Dialogkanten |
| Erfolg | `#94c9a1` auf `#20382a` | Erfolgsstatus |
| Hinweis / laufende Verarbeitung | `#e6b86a` | Status auf dunkler Fläche |
| Fehler | `#f2aa99` auf `#3b2523` | Fehlerstatus und Fehlermeldungen |

Der Sekundärtext ist in Thomnail heller als im ursprünglichen Schach-Comment-
Aurora (`#8f98b2`). Für neue Apps gilt die hier angegebene, besser lesbare Variante.

## Hintergrund und Panels

Der Hintergrund trägt Cyan oben links und Violett unten rechts. Die Mitte bleibt
dunkel. Die Verläufe sind statisch; ihre Ausdehnung darf an die Fenstergröße
angepasst werden.

```css
.aurora-background {
  background-color: #030409;
  background-image:
    radial-gradient(70rem 40rem at 8% -8%, rgba(75, 225, 255, 0.32), transparent 58%),
    radial-gradient(74rem 46rem at 98% 106%, rgba(139, 124, 255, 0.34), transparent 62%),
    radial-gradient(40rem 24rem at 55% 45%, rgba(75, 225, 255, 0.05), transparent 70%);
}

.aurora-panel {
  background: #101526;
  border: 1px solid rgba(140, 190, 255, 0.22);
  border-radius: 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 8px 24px rgba(0, 0, 0, 0.4);
}
```

Dialoge verwenden eine nahezu deckende Fläche, zum Beispiel
`rgba(11, 14, 25, 0.97)`. Ein weichgezeichneter Hintergrund ist optional. Ohne
Blur-Unterstützung muss der Dialog genauso lesbar bleiben. Native Transparenz
zum Desktop ist eine optionale Plattformanpassung; Thomnail setzt derzeit den
Glaseindruck innerhalb der Oberfläche um.

## Bedienelemente

| Element | Vorschlag |
| --- | --- |
| Primärbutton | Cyanfläche, dunkle Schrift, 8 px Radius, Schriftgewicht 600 |
| Sekundärbutton | Dunkelblaue Fläche, heller Text, feiner Rand |
| Eingabefeld | Dunkler Hintergrund, heller Text, gut sichtbarer Rand, 6–8 px Radius |
| Regler | Gedämpfte blaue Spur, Cyan-Griff mit dunkler Abgrenzung, sichtbarer Wert |
| Tastaturfokus | 2 px Cyan-Kontur mit 3 px Abstand; optional zurückhaltender Glow |
| Panel / Dialog | 14 px Radius, kühle Kante, Glanzkante oben, dunkler Schatten |
| Dateiliste | Kompakte Zeilen; Details bei Bedarf aufklappen |

Eine Ansicht soll eine klare Hauptaktion haben. Deaktivierte Zustände müssen
erkennbar bleiben. Standard-, Hover-, Fokus-, Gedrückt- und Fehlerzustände sind
bei jeder neuen Komponente bewusst zu gestalten.

## Schrift, Kontrollgrößen und Abstände

Die folgenden Werte sind der Standard für neue Aurora-Entwürfe. Größen stehen
in CSS-Pixeln beziehungsweise entsprechenden logischen Einheiten des nativen
Frameworks. Sie skalieren mit den Text- und Bedienungseinstellungen. Bestehende
Apps werden dadurch nicht automatisch umgestellt.

| Typografierolle | Größe / Zeilenhöhe | Gewicht | Verwendung |
| --- | --- | --- | --- |
| Fenstertitel | 22 / 28 px | 600 | Hauptüberschrift im App-Inhalt |
| Abschnittstitel | 17 / 24 px | 600 | Panel- und Dialogüberschriften |
| Standardtext | 14 / 20 px | 400 | Inhalte, Listen und Beschriftungen |
| Bedienelementtext | 14 / 20 px | 600 | Buttons und hervorgehobene Werte |
| Hilfstext | 13 / 18 px | 400 | Erläuterungen und sekundäre Statusangaben |

Systemschrift verwenden: SF auf macOS, Segoe UI auf Windows, entsprechende
Systemschrift auf anderen Plattformen. Web-Fallback:
`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
Wichtige Informationen werden nicht kleiner als die Hilfstextrolle gesetzt.

| Größe / Abstand | Standard |
| --- | --- |
| Button und einzeiliges Eingabefeld | mindestens 36 px hoch; bei mehrzeiligem Text mitwachsend |
| Button-Innenabstand | 8 px vertikal, 16 px horizontal |
| Eingabefeld-Innenabstand | 8 px vertikal, 12 px horizontal |
| Icon-Button | mindestens 36 × 36 px Bedienfläche; Symbol 20 px |
| Checkbox / Radio | 18 px sichtbares Zeichen; gesamte beschriftete Zeile bedienbar, mindestens 36 px hoch |
| Regler | mindestens 36 px hohe Bedienfläche; Spur 6 px, Griff 18 px |
| Abstand Beschriftung zu Feld | 8 px |
| Abstand innerhalb einer Gruppe | 8–12 px je nach Beziehung |
| Abstand zwischen Gruppen | 16 px |
| Panel- / Dialog-Innenabstand | 24 px |
| Außenabstand einer Ansicht | 24 px; bei schmalen Fenstern 16 px |
| Abstand zwischen Abschnitten | 24 px |

Die Abstandsskala basiert auf 4 px: 4, 8, 12, 16, 20, 24 und 32 px.
Für Touch-Bedienung die Bedienflächen auf mindestens 44 × 44 px erweitern.
Zeilenhöhen, Textvergrößerung und Lokalisierung dürfen nicht durch feste
Containerhöhen abgeschnitten werden.

Kurze Übergänge von 120–200 ms reichen für Hover und Zustandswechsel.
Daueranimationen sind nicht erforderlich. Bei reduzierter Bewegung des
Betriebssystems entfallen dekorative Animationen.

## Semantische Rollen und Cyan-Hierarchie

Farben nach Bedeutung benennen und in jedem Framework entsprechend zuordnen:
`text.primary`, `text.secondary`, `surface.base`, `surface.raised`,
`border.interactive`, `border.decorative`, `action.primary`, `focus.ring`,
`selection.background` und `progress.fill`. Die Farbpalette oben liefert die
Werte. `border.interactive` verwendet `#62799a`, `border.decorative` die
transparente Panelkante. Ein dekorativer Rand ersetzt keinen interaktiven Rand.

| Bedeutung | Darstellung | Ergänzendes Signal |
| --- | --- | --- |
| Hauptaktion | gefülltes Cyan `#17bde0`, dunkler Text `#04222c` | konkretes Tätigkeitswort; eine dominierende Aktion pro Ansicht |
| Tastaturfokus | Cyan-Kontur `#4be1ff`, 2 px breit, 3 px Abstand | umschließt das fokussierte Element; optional Glow |
| Auswahl / aktiv | schwache Cyan-Tönung `rgba(75, 225, 255, 0.12)` | Häkchen, Seitenmarkierung oder ausgewiesener Auswahlzustand |
| Fortschritt | Cyan-Füllung `#4be1ff` auf dunkler Spur | Balken plus Zahlen und Text, etwa „3 von 8 verarbeitet“ |

Fokus und Auswahl bleiben unabhängig: Eine ausgewählte Zeile kann zusätzlich
den Fokusring erhalten. Ein Fokuszustand darf keine Aktion auslösen. Die
Hauptaktion bleibt durch ihre gefüllte Fläche stärker gewichtet als Auswahl,
Fortschritt oder dekorative Akzente.

| Komponentenzustand | Standarddarstellung |
| --- | --- |
| Standard | jeweilige Komponentenfarbe; Text und Rand klar sichtbar |
| Hover | Primärbutton `#0fa3c4`; sekundäre Flächen leicht aufgehellt, z. B. `#1b2740` |
| Gedrückt | Hover-Farbe plus innere dunkle Kante, z. B. `inset 0 2px 0 rgba(0, 0, 0, 0.3)`; kein Layoutsprung |
| Fokus | separater Cyan-Ring zusätzlich zum aktuellen Zustand |
| Deaktiviert | gedämpfte Fläche `#101526`, Sekundärtext `#a7b2ca`, Rand `#62799a`; keine Hover-/Drückreaktion, semantisch deaktiviert |
| Lädt / beschäftigt | beschrifteter Fortschrittsindikator; doppelte Auslösung blockiert; Maße bleiben stabil |
| Fehler im Feld | Fehlermarkierung und verständlicher Text direkt am Feld; Fokus bleibt bei Bedarf sichtbar |

Die Hintergrundverläufe dürfen die Flächenhierarchie ergänzen. Grundfläche,
Inhaltsfläche und erhöhtes Panel müssen auch ohne Glow, Schatten oder Blur
anhand ihrer Flächenfarbe, Kante und Abstände unterscheidbar bleiben. Das beim
Entwurfsreview ausdrücklich mit ausgeschalteten Effekten prüfen.

## Zustände und Rückmeldungen

Zu jedem Entwurf gehören neben dem Erfolgsfall die für die Aufgabe relevanten
Zustände. Texte beschreiben Ergebnis und nächsten möglichen Schritt.

| Zustand | Rückmeldung und Verhalten |
| --- | --- |
| Noch keine Auswahl / leer | kurze Erklärung und eindeutige Startaktion, etwa „Ordner wählen“ |
| Laden / Verarbeitung | laufende Tätigkeit benennen; bei bekanntem Umfang Zahlen zeigen; ohne bekannten Umfang keine erfundenen Prozentwerte |
| Kein passender Inhalt | z. B. „Keine Videos gefunden. Wähle einen Ordner mit unterstützten Videodateien.“; erneute Auswahl anbieten |
| Ungültige Eingabe / Voraussetzung | Problem am betroffenen Feld erklären, etwa „ffmpeg wurde unter diesem Pfad nicht gefunden.“; Korrektur ermöglichen und betroffene Hauptaktion bis dahin sperren |
| Vollständiger Erfolg | konkretes Ergebnis anzeigen, z. B. „8 von 8 Datei-Icons erstellt.“; neue Aufgabe ermöglichen |
| Teilerfolg | Erfolge, Fehler und übersprungene Einträge getrennt zählen; fehlerhafte Einträge mit Details zugänglich machen |
| Fehler | verständliche Zusammenfassung und nächster Schritt; technische Details bei Bedarf aufklappbar und kopierbar |
| Erneuter Versuch | nur anbieten, wenn unterstützt; Umfang benennen, etwa „Fehlgeschlagene erneut versuchen“; erfolgreiche Ergebnisse nicht versehentlich erneut verändern |
| Abbruch | nur anbieten, wenn die Verarbeitung sicher abbrechbar ist; Zwischenzustand „Wird abgebrochen…“ und anschließend erhaltene Ergebnisse sowie nicht verarbeitete Einträge erklären |

Während eines laufenden Auftrags bleiben die Parameter dieses Auftrags stabil.
Als Standard sind Ordnerwahl und verarbeitungsrelevante Einstellungen bis zum
Abschluss gesperrt. Soll eine App Änderungen für den nächsten Auftrag zulassen,
muss sie das ausdrücklich kennzeichnen; sie dürfen den laufenden Auftrag nicht
unbemerkt ändern. Zugängliche Statusanzeige, Fehlerdetails und eine tatsächlich
unterstützte Abbruchaktion bleiben bedienbar.

Die Tabelle definiert Entwurfsregeln für neue Apps. Sie behauptet nicht, dass
alle genannten Funktionen in Thomnail oder jeder bestehenden App vorhanden
sind. Entwürfe kennzeichnen zusätzliche Funktionen als Vorschlag, bis ihre
Umsetzung bestätigt ist.

## Lesbarkeit und Zugänglichkeit

Die folgenden Kontraste wurden aus den festen Farbwerten berechnet:

| Kombination | Kontrast |
| --- | --- |
| Dunkler Buttontext auf Cyan-Primärbutton | ca. 7,4:1 |
| Dunkler Buttontext auf Hover-Cyan | ca. 5,6:1 |
| Sekundärtext auf erhöhter Fläche | ca. 8,5:1 |
| Haupttext auf erhöhter Fläche | ca. 14,5:1 |

Für neue Komponenten gelten als Entwurfsziele mindestens 4,5:1 für normalen Text
und 3:1 für wesentliche Bedienelemente gegenüber angrenzenden Flächen. Transparente
Farben müssen gegen den tatsächlich zusammengesetzten Hintergrund geprüft werden.
Die dekorative Panelkante ersetzt keinen gut sichtbaren Eingaberand.

- Alle Aktionen sind per Tastatur erreichbar und erhalten einen sichtbaren Fokus.
- Icon-Buttons bekommen einen zugänglichen Namen; Regler eine Beschriftung und
  einen verständlichen Wert.
- Status verwendet neben Farbe auch Text oder ein verständliches Symbol.
- Gekürzte Pfade und Dateinamen bleiben vollständig zugänglich. Tooltips ergänzen
  die Anzeige; wichtige Informationen brauchen auch einen Zugang per Tastatur
  beziehungsweise über die zugängliche Beschriftung.
- Fehlerdetails sind vollständig lesbar und kopierbar. Kurze Meldungen erklären
  möglichst Ursache und nächsten Schritt; technische Details können aufklappbar sein.
- Fensterverkleinerung, Textvergrößerung und lange Inhalte dürfen keine wichtigen
  Aktionen oder Meldungen unerreichbar machen.

## Übernahme in weitere Apps

1. Farbrollen und Komponentenregeln aus diesem Dokument übernehmen. Unter anderen
   Frameworks die Rollen auf deren Theme-System abbilden.
2. Die für die App notwendige Struktur entwerfen: Einzelansicht, mehrere Bereiche
   oder Navigation je nach Aufgabe.
3. Schriftrollen, Kontrollgrößen und Cyan-Rollen anwenden. Hauptansicht,
   Einstellungen sowie relevante Leer-, Lade-, Erfolgs-, Teilerfolgs- und
   Fehlerzustände gestalten; unterstützte Wiederhol- und Abbruchpfade berücksichtigen.
4. In der laufenden App Textkontrast, Tastaturfokus, lange Inhalte und kleine
   Fenster prüfen. Transparenz und Blur auf der Zielplattform kontrollieren.

Wiedererkennbar bleiben Palette, Typografie, Fokusdarstellung und Panelgestaltung.
Fensteraufteilung, Informationsdichte, Symbole und Navigation können sich je nach
App unterscheiden. Eine helle Variante ist noch nicht definiert und benötigt
eigene Farben und Kontrastprüfungen.

Als Aufgabenbeschreibung für ein neues Projekt eignet sich:

> Verwende das Aurora-App-Design gemäß dieser Referenz: Nachtblau, Cyan-Akzente,
> dezenter Cyan-/Violett-Hintergrund, dunkle gut lesbare Panels und dunkle Schrift
> auf Cyan-Buttons. Passe den Aufbau an die Aufgabe der App an und prüfe die
> Darstellung in der laufenden Anwendung.

