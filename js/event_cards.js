/**
 * Event Cards Deck and Resolution for 'The War of the Worlds'
 */

export const EVENT_CARDS_DECK = [
    {
        id: "hms_thunderchild",
        title: "HMS Thunderchild",
        desc: "Das gepanzerte Panzerschiff HMS Thunderchild dampft heran, um Flüchtlingsschiffe im Kanal vor den marsianischen Dreibeinern zu schützen. Platziere den Thunderchild-Counter auf der Seekarte.",
        options: [
            {
                text: "HMS Thunderchild bereitstellen (Erhalte 1 kostenloses Panzerschiff in der nächsten Seeschlacht)",
                action: (state) => {
                    state.hmsThunderchildAvailable = True;
                    state.log("Event: HMS Thunderchild patrouilliert im Ärmelkanal.", "human");
                }
            }
        ]
    },
    {
        id: "curate",
        title: "Der Kurat",
        desc: "Ein hysterischer Geistlicher schließt sich deinen Truppen an. Er predigt das Ende der Welt, kann aber auch den Mut der Soldaten anstacheln... oder sie ins Verderben stürzen.",
        options: [
            {
                text: "Als Prediger einsetzen (Erhalte 1 Charakter-Counter 'Kurat' in London. Zählt als Infanterie für Opferungen.)",
                action: (state) => {
                    state.spawnCharacter("Curate", "London");
                    state.log("Event: Der Kurat predigt in London.", "human");
                }
            }
        ]
    },
    {
        id: "heliograph",
        title: "Heliograph-Signale",
        desc: "Spiegel-Signalstationen ermöglichen eine schnelle Kommunikation über weite Strecken hinweg. Dies erleichtert die Koordinierung der Streitkräfte.",
        options: [
            {
                text: "Signalkette aufbauen (Platziere Heliograph in Leicester. Ermöglicht 1 kostenlosen Schlachtplan pro Runde)",
                action: (state) => {
                    state.spawnCharacter("Heliograph", "Leicester");
                    state.log("Event: Heliograph-Station in Leicester eingerichtet.", "human");
                }
            }
        ]
    },
    {
        id: "gun_95t",
        title: "Die 95-Tonnen-Kanone",
        desc: "Ein gigantisches Küstengeschütz wird in Stellung gebracht, um die Themsemündung abzusichern.",
        options: [
            {
                text: "Kanone in London aufstellen (Erhalte ein stationäres Superschweres Geschütz in London, Würfelt 3 Würfel im Kampf)",
                action: (state) => {
                    state.spawn95tGun("London");
                    state.log("Event: 95-Tonnen-Kanone in London feuerbereit.", "human");
                }
            }
        ]
    },
    {
        id: "narrator",
        title: "Der Journalist (Narrator)",
        desc: "Ein schreibender Augenzeuge berichtet über das Grauen der Marsianer und stärkt den Kampfgeist der Bevölkerung durch seine Berichte.",
        options: [
            {
                text: "Zeitungsberichte drucken (Platziere Narrator in London. Erzeugt +1 Human VP für jeden entkommenen Flüchtling in seiner Zone)",
                action: (state) => {
                    state.spawnCharacter("Narrator", "London");
                    state.log("Event: Der Journalist berichtet über den Krieg aus London.", "human");
                }
            }
        ]
    },
    {
        id: "steampunk_reinforcements",
        title: "Dampfbetriebene Kriegsmaschinen",
        desc: "Königliche Fabriken stellen Prototypen neuer mechanisierter Verbände her, um die Infanterie zu unterstützen.",
        options: [
            {
                text: "Produktion ankurbeln (+15 PP sofort)",
                action: (state) => {
                    state.pp += 15;
                    state.log("Event: Fabriken liefern eiserne Verstärkungen. +15 PP.", "human");
                }
            }
        ]
    },
    {
        id: "victorian_resolve",
        title: "Viktorianische Entschlossenheit",
        desc: "Die Königin hält eine aufrüttelnde Rede. Das Volk steht fest zusammen, um das Empire zu verteidigen.",
        options: [
            {
                text: "Siegpunkte sichern (+2 Human VPs)",
                action: (state) => {
                    state.addHumanVp(2);
                    state.log("Event: Die Rede der Königin stärkt die Moral. +2 Siegpunkte.", "human");
                }
            }
        ]
    },
    {
        id: "panic_streets",
        title: "Panik in den Straßen",
        desc: "Gerüchte über die Hitze-Strahlen verbreiten sich. Die Massen fliehen panisch aus den Städten.",
        options: [
            {
                text: "Flüchtlinge evakuieren (Bewege alle Flüchtlinge um 1 Zone näher an den nächsten Hafen)",
                action: (state) => {
                    state.evacuateRefugeesLogic();
                    state.log("Event: Massenflucht setzt ein. Flüchtlinge strömen Richtung Küste.", "human");
                }
            }
        ]
    },
    {
        id: "redweed_spread",
        title: "Wachstum des Roten Krauts",
        desc: "Das marsianische Rote Kraut breitet sich über die verwüstete Landschaft aus und verzehrt die Nährstoffe der Erde.",
        options: [
            {
                text: "Ausbreitung auswürfeln (Würfle für jede zerstörte Zone. Bei Rot wird sie zu Rotes Kraut)",
                action: (state) => {
                    state.triggerRedWeedSpread();
                }
            }
        ]
    },
    {
        id: "cylinder_fail",
        title: "Fehlfunktion beim Wiedereintritt",
        desc: "Ein marsianischer Zylinder verfehlt seine berechnete Flugbahn und schlägt hart im Meer auf.",
        options: [
            {
                text: "Marsianischen Bau verzögern (Entferne 1 Tripod aus einem Cylinder im Bau, falls vorhanden)",
                action: (state) => {
                    state.sabotageCylinder();
                    state.log("Event: Ein marsianischer Zylinder schlägt fehlerhaft auf.", "human");
                }
            }
        ]
    },
    {
        id: "heatray_overload",
        title: "Überlastung des Hitzestrahls",
        desc: "Die Energiekristalle eines Tripods überhitzen im Gefecht und beschädigen die Maschine.",
        options: [
            {
                text: "Einem Dreibeiner Schaden zufügen (Flippe 1 unbeschädigten Tripod auf der Karte auf seine Damaged-Seite)",
                action: (state) => {
                    state.damageRandomTripodOnMap();
                }
            }
        ]
    },
    {
        id: "industrial_espionage",
        title: "Taktische Pläne entworfen",
        desc: "Militärstrategen analysieren die Schwachstellen der marsianischen Schild-Generatoren.",
        options: [
            {
                text: "Schlachtpläne erwerben (+2 zufällige kostenlose Schlachtpläne)",
                action: (state) => {
                    state.addRandomBattlePlan();
                    state.addRandomBattlePlan();
                    state.log("Event: Neue Pläne an die Front geschickt.", "human");
                }
            }
        ]
    }
];

export class EventDeck {
    constructor() {
        this.deck = [];
        this.discard = [];
        this.reset();
    }

    reset() {
        this.deck = [...EVENT_CARDS_DECK];
        this.shuffle();
        this.discard = [];
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    draw() {
        if (this.deck.length === 0) {
            if (this.discard.length === 0) return null;
            this.deck = [...this.discard];
            this.shuffle();
            this.discard = [];
        }
        const card = this.deck.pop();
        this.discard.push(card);
        return card;
    }
}
