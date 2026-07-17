/**
 * Tactical Sea Battle (Sea Encounter) Engine for 'The War of the Worlds'
 */

export class NavalManager {
    constructor(gameState) {
        this.state = gameState;
        this.reset();
    }

    reset() {
        this.active = false;
        this.zoneName = "";
        this.boardType = "sea";
        this.round = 1;
        this.tripods = []; // Martian attackers standing at column A (index 0)
        this.freighters = []; // Refugee boats: { id, type: 'refugee1'|'refugee2', col, row, status: 'sailing'|'escaped'|'destroyed' }
        this.warships = []; // Protective ironclads: { id, col, row, damage }
        this.log = [];
    }

    logMsg(msg, side = "system") {
        this.log.push({ msg, side });
        if (this.state.logCallback) {
            this.state.logCallback(msg, side);
        }
    }

    /**
     * Start a Sea Encounter (Evakuation abgefangen)
     * @param {string} zoneName The harbor zone
     * @param {number} numTripods 1 or 2
     * @param {number} numRefugees1 Count of type 1 refugees escaping
     * @param {number} numRefugees2 Count of type 2 refugees escaping
     */
    startSeaBattle(zoneName, numTripods, numRefugees1, numRefugees2) {
        this.active = true;
        this.zoneName = zoneName;
        this.boardType = "sea";
        this.round = 1;
        this.tripods = [];
        this.freighters = [];
        this.warships = [];
        this.log = [];

        this.logMsg(`--- SEESCHLACHT IM HAFEN VON ${zoneName.toUpperCase()} ---`, "system");
        this.logMsg(`Marsianer greifen mit ${numTripods} Tripods die Evakuierungsboote an!`, "martian");

        // 1. Setup Tripods in Column A (col = 0)
        const colors = ["green", "yellow", "red"];
        for (let i = 0; i < numTripods; i++) {
            const color = colors[i % colors.length];
            this.tripods.push({
                color: color,
                damaged: false,
                col: 0, // Column A (Coast)
                row: 1 + i * 2, // staggered rows
                maxRange: color === "green" ? 1 : (color === "yellow" ? 2 : 3)
            });
        }

        // 2. Setup Refugee Freighters in Column B (col = 1)
        let rowIdx = 0;
        for (let i = 0; i < numRefugees1; i++) {
            this.freighters.push({
                id: `freighter_1_${i}`,
                type: "refugee1",
                col: 1, // Column B
                row: rowIdx++,
                status: "sailing"
            });
        }
        for (let i = 0; i < numRefugees2; i++) {
            this.freighters.push({
                id: `freighter_2_${i}`,
                type: "refugee2",
                col: 1, // Column B
                row: rowIdx++,
                status: "sailing"
            });
        }

        // 3. Add HMS Thunderchild if active from Event Phase
        if (this.state.hmsThunderchildAvailable) {
            this.warships.push({
                id: "thunderchild",
                col: 1, // Start in B
                row: rowIdx++,
                damage: 0,
                isThunderchild: true
            });
            this.state.hmsThunderchildAvailable = false; // spent
            this.logMsg("Die legendäre HMS Thunderchild dampft zur Verteidigung heran!", "human");
        }

        this.logMsg("Du kannst jetzt Panzerschiffe (Warships) für 10 PP pro Schiff kaufen, um deine Flüchtlinge zu decken.", "human");
    }

    /**
     * Purchase a protective ironclad (Warship) using PP
     */
    buyWarship() {
        if (!this.active) return;
        if (this.state.pp < 10) {
            this.logMsg("Nicht genügend PP (1 Panzerschiff kostet 10 PP).", "system");
            return;
        }

        this.state.pp -= 10;
        
        // Place in Column B (col = 1) at a free row
        const row = this.freighters.length + this.warships.length;
        this.warships.push({
            id: `warship_${Date.now()}`,
            col: 1,
            row: row,
            damage: 0
        });

        this.logMsg("Panzerschiff gekauft und in Kolonne B platziert. -10 PP.", "human");
        
        if (this.state.uiUpdateCallback) {
            this.state.uiUpdateCallback();
        }
    }

    /**
     * Human Turn: Move all ships/freighters 1 column right and fire warships
     */
    executeHumanTurn() {
        if (!this.active) return;
        this.logMsg(`--- Menschheit am Zug (Runde ${this.round}) ---`, "human");

        // 1. Move all sailing freighters and warships 1 step right (B->C->D->E)
        this.freighters.forEach(f => {
            if (f.status === "sailing") {
                f.col++;
                this.logMsg(`Flüchtlingsboot bewegt sich in Spalte ${String.fromCharCode(65 + f.col)}.`, "human");
                
                // If it reaches Column E (col = 4), it escapes!
                if (f.col === 4) {
                    f.status = "escaped";
                    const vpAward = f.type === "refugee2" ? 2 : 1;
                    this.state.addHumanVp(vpAward);
                    this.logMsg(`Erfolg! Flüchtlinge sind entkommen. +${vpAward} Siegpunkte für die Menschheit!`, "human");
                }
            }
        });

        this.warships.forEach(w => {
            if (w.col < 4) {
                w.col++;
                this.logMsg(`Panzerschiff rückt vor in Spalte ${String.fromCharCode(65 + w.col)}.`, "human");
            }
        });

        // 2. Fire Warships at Tripods
        this.warships.forEach(w => {
            if (this.tripods.length === 0) return;
            
            // Warships can fire at Tripods in column A (index 0) if within range (all warships have range 3 in sea battles)
            const target = this.tripods[0]; // fire at first tripod
            
            this.logMsg(`Panzerschiff feuert auf ${target.color}-Tripod!`, "human");
            const roll = this.state.rollCustomDie();
            
            // Warships hit on Red/Yellow (4/6)
            if (roll === "red" || roll === "yellow") {
                if (target.damaged) {
                    this.tripods.shift();
                    this.logMsg(`Panzerschiff zerstört ${target.color}-Tripod!`, "human");
                    this.state.addHumanVp(1);
                } else {
                    target.damaged = true;
                    this.logMsg(`Panzerschiff beschädigt ${target.color}-Tripod.`, "human");
                }
            } else {
                this.logMsg("Panzerschiff-Feuer verfehlt.", "system");
            }
        });

        // Check if battle ends after escapes
        if (this.checkBattleEnd()) return;

        // Martian turn
        setTimeout(() => this.executeMartianTurn(), 800);
    }

    /**
     * Martian Turn: Tripods fire at nearest human ships/freighters
     */
    executeMartianTurn() {
        if (!this.active) return;
        this.logMsg(`--- Marsianer am Zug (Runde ${this.round}) ---`, "martian");

        this.tripods.forEach(t => {
            // Find all targets in range of this tripod's heat ray
            const targets = [];
            
            this.freighters.forEach(f => {
                if (f.status === "sailing" && f.col <= t.maxRange) {
                    targets.push({ type: "freighter", obj: f, dist: f.col });
                }
            });

            this.warships.forEach(w => {
                if (w.col <= t.maxRange) {
                    targets.push({ type: "warship", obj: w, dist: w.col });
                }
            });

            if (targets.length === 0) return;

            // Target prioritisation: Warships first (threat), then closest
            targets.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === "warship" ? -1 : 1; // target warships first
                }
                return a.dist - b.dist; // closest first
            });

            const target = targets[0];
            
            this.logMsg(`Tripod (${t.color}) feuert Hitzestrahl auf ${target.type === "warship" ? "Panzerschiff" : "Flüchtlingsboot"} in Spalte ${String.fromCharCode(65 + target.obj.col)}.`, "martian");

            const roll = this.state.rollCustomDie();
            if (roll === "green" || roll === "yellow") {
                if (target.type === "freighter") {
                    target.obj.status = "destroyed";
                    this.state.addMartianVp(1); // +1 Martian VP for destroying refugees
                    this.logMsg(`KATASTROPHE! Flüchtlingsboot in Spalte ${String.fromCharCode(65 + target.obj.col)} wurde versenkt! +1 Marsianer-Siegpunkt.`, "danger");
                } else {
                    target.obj.damage++;
                    this.logMsg(`Panzerschiff nimmt Treffer! (Schaden: ${target.obj.damage})`, "danger");
                    if (target.obj.damage >= 2) {
                        this.warships = this.warships.filter(w => w.id !== target.obj.id);
                        this.logMsg("Panzerschiff wurde komplett zerstört!", "danger");
                    }
                }
            } else {
                this.logMsg("Hitzestrahl schlägt zischend im Meerwasser ein.", "system");
            }
        });

        this.round++;
        
        // Check if battle ends
        if (this.checkBattleEnd()) return;

        if (this.state.uiUpdateCallback) {
            this.state.uiUpdateCallback();
        }
    }

    /**
     * Check if battle is over: no sailing freighters left
     */
    checkBattleEnd() {
        const sailing = this.freighters.filter(f => f.status === "sailing");
        if (sailing.length === 0) {
            this.active = false;
            this.logMsg("--- SEESCHLACHT BEENDET ---", "system");
            
            const escapedCount = this.freighters.filter(f => f.status === "escaped").length;
            const lostCount = this.freighters.filter(f => f.status === "destroyed").length;
            this.logMsg(`Evakuierungsbericht: ${escapedCount} Boote entkommen, ${lostCount} Boote verloren.`, "system");

            // Return to strategic map
            if (this.state.battleCallback) {
                this.state.battleCallback(escapedCount > 0);
            }
            return true;
        }
        return false;
    }
}
