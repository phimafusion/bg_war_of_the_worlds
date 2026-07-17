# The War of the Worlds - Digital Board Game (England Edition)

Dies ist eine browserbasierte, digitale Umsetzung des Solitär-Brettspiels **"The War of the Worlds: England"** (Dan Verssen Games). 

Das Spiel simuliert die marsianische Invasion von England im späten 19. Jahrhundert, basierend auf dem berühmten Science-Fiction-Roman von H.G. Wells. Du übernimmst die Verteidigung der Menschheit (Infanterie, Kavallerie, Artillerie und Panzerschiffe), um die vorrückenden marsianischen Tripods abzuwehren, Flüchtlinge zu retten und das Überleben Londons zu sichern.

## Features
*   **Originalgetreue Spielregeln:** Exakte Nachbildung der Phasen, Tabellen, Zonen und Bewegungen des Original-Brettspiels.
*   **Original-Grafiken:** Einbindung des originalen Spielbretts (`map.jpg`) und der Taktik-Karten (`tactical_maps.jpg`).
*   **Atmosphärisches Steampunk-Design:** Edle Benutzeroberfläche im viktorianischen Messing- und Kupfer-Stil mit animierten Würfeln und interaktiven Phasen.
*   **Interaktive Schlachten:** Taktischer Land- und Seekampf auf einem voll funktionsfähigen Hex-Raster mit AI-gesteuerten Tripods.
*   **Integrierte Test-Suite:** Direkt im Browser ausführbare Unit-Tests zur Verifikation der Spielmechanik.

## Installation & Start

Da das Spiel vollständig mit modernem HTML5, CSS und JavaScript (ES6 Modules) entwickelt ist, benötigt es keine Installation von Node.js oder externen Bibliotheken. Es läuft in jedem modernen Webbrowser.

1.  Öffne eine Shell im Projektordner.
2.  Starte den lokalen Python-Webserver:
    ```bash
    py -m http.server 8000
    ```
3.  Öffne deinen Webbrowser und navigiere zu:
    *   **Spiel spielen:** [http://localhost:8000/index.html](http://localhost:8000/index.html)
    *   **Unit-Tests ausführen:** [http://localhost:8000/tests.html](http://localhost:8000/tests.html)

## Spielphasen
Jede Spielrunde besteht aus 8 Phasen (gesteuert über das Clock-Rad am oberen Bildschirmrand):
1.  **Production Phase:** Sammle Produktionspunkte (PP) aus deinen Zonen und kaufe Einheiten (Infanterie, Kavallerie, Artillerie, Häfen).
2.  **Devastation Phase:** Marsianische Wellen führen Verwüstungsangriffe (Heat Ray, Black Smoke, Panic) durch und zerstören deine Zonen.
3.  **Battle Phase:** Führe Schlachten in Zonen aus, in denen sowohl Marsianer als auch deine Artillerie stehen (Wechsel zum taktischen Kampfschirm).
4.  **Human Action Phase:** Bewege deine Truppen und Flüchtlinge oder führe Spezialaktionen durch (Cylinder Attack, Earthworks, Powder Mill).
5.  **Escape Phase:** Evakuiere Flüchtlinge in Zonen mit Häfen über die Seeschlacht-Karte. Neue Zylinder landen auf der Erde.
6.  **Martian Action Phase:** Die Marsianer-AI führt Aktionen durch (Bewegen, Reparieren oder Bauen der Flugmaschine).
7.  **Assembly Phase:** Zylinder können sich in aktive Tripod-Wellen verwandeln, wenn sie mit den Handling Machines übereinstimmen.
8.  **Event Phase:** Ziehe eine Event-Karte und wende deren Effekt an.

## Entwickler-Informationen
Die Entwicklung wird auf dem Branch `feature/initial-design` durchgeführt.
*   Kernlogik: [js/game.js](file:///c:/Users/phili/Documents/antigravity_git/bg_war_of_the_worlds/js/game.js)
*   Strategische Karte: [js/map.js](file:///c:/Users/phili/Documents/antigravity_git/bg_war_of_the_worlds/js/map.js)
*   Schlachten: [js/battle.js](file:///c:/Users/phili/Documents/antigravity_git/bg_war_of_the_worlds/js/battle.js) & [js/naval.js](file:///c:/Users/phili/Documents/antigravity_git/bg_war_of_the_worlds/js/naval.js)
*   Benutzeroberfläche: [js/ui.js](file:///c:/Users/phili/Documents/antigravity_git/bg_war_of_the_worlds/js/ui.js)
*   Tests: [js/tests/suite.js](file:///c:/Users/phili/Documents/antigravity_git/bg_war_of_the_worlds/js/tests/suite.js)
