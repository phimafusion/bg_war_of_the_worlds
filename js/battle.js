/**
 * Tactical Land Battle Engine for 'The War of the Worlds'
 */

export class BattleManager {
    constructor(gameState) {
        this.state = gameState;
        this.reset();
    }

    reset() {
        this.active = false;
        this.zoneName = "";
        this.boardType = "land"; // 'land' or 'sea'
        this.round = 1;
        this.initiative = "H"; // 'H' (Human) or 'M' (Martian)
        this.currentTurn = "H"; // who is acting now
        this.units = []; // Human tactical units: { id, type, col, row, revealed, earthworks, damage }
        this.tripods = []; // Martian tactical units: { color, type, col, row, damaged, maxRange }
        this.log = [];
        this.drawnCard = null;
        this.history = [];
    }

    logMsg(msg, side = "system") {
        this.log.push({ msg, side });
        if (this.state.logCallback) {
            this.state.logCallback(msg, side);
        }
    }

    /**
     * Set up a Land Battle in a specific zone
     * @param {string} zoneName 
     */
    startLandBattle(zoneName) {
        this.active = true;
        this.zoneName = zoneName;
        this.boardType = "land";
        this.round = 1;
        this.units = [];
        this.tripods = [];
        this.log = [];
        
        this.logMsg(`--- LANDSCHLACHT IN ${zoneName.toUpperCase()} BEGINNT ---`, "system");

        // 1. Get human units from the zone
        const zone = this.state.map.zones[zoneName];
        let col = 0;
        zone.units.forEach(u => {
            if (u.type === "fieldgun" || u.type === "siegegun") {
                this.units.push({
                    id: u.id,
                    type: u.type,
                    col: col % 5,
                    row: 4, // bottom row (row 5)
                    revealed: false,
                    earthworks: 0,
                    damage: 0
                });
                col++;
            }
        });

        // Add initial Earthworks if human spent actions before
        // (For simplicity, field guns start with 1 earthwork automatically to be fair)
        this.units.forEach(u => {
            u.earthworks = u.type === "siegegun" ? 2 : 1;
        });

        // 2. Get Martian Tripods from the wave in this zone
        // If there's a wave in this zone, grab its tripods
        const wave = this.state.waves[zoneName];
        if (wave && wave.tripods.length > 0) {
            wave.tripods.forEach((t, idx) => {
                this.tripods.push({
                    color: t.color,
                    damaged: t.damaged,
                    col: idx % 5, // initial column, will be modified by card setup
                    row: 0, // top row (row 1)
                    maxRange: this.getTripodRange(t.color)
                });
            });
        } else {
            // Default setup for a single random tripod if no wave is defined (fallback)
            this.tripods.push({
                color: "green",
                damaged: false,
                col: 2,
                row: 0,
                maxRange: 1
            });
        }

        // 3. Draw a Battle Card to determine initiative and setup
        this.drawBattleCard();
    }

    getTripodRange(color) {
        switch(color) {
            case "green": return 1;
            case "yellow": return 2;
            case "red": return 3;
            case "black": return 3;
            case "blue": return 2;
            default: return 1;
        }
    }

    drawBattleCard() {
        this.drawnCard = this.state.battleDeck.draw();
        if (!this.drawnCard) {
            this.state.battleDeck.reset();
            this.drawnCard = this.state.battleDeck.draw();
        }

        if (this.drawnCard) {
            this.initiative = this.drawnCard.initiative;
            this.currentTurn = this.initiative;
            this.logMsg(`Kampfkarte gezogen: Initiative geht an ${this.initiative === "H" ? "Menschheit" : "Marsianer"}.`, "system");

            // Apply card setup to Tripod column positions
            const setup = this.drawnCard.setup;
            this.tripods.forEach(t => {
                const targetColLetter = setup[t.color];
                if (targetColLetter) {
                    t.col = targetColLetter.charCodeAt(0) - 65; // 'A'->0, 'B'->1, ...
                }
            });

            this.logMsg("Marsianische Tripods formieren sich in Reihe 1.", "martian");
        } else {
            this.initiative = "H";
            this.currentTurn = "H";
        }
    }

    /**
     * Executes the Martian AI Turn using the drawn battle card actions
     */
    executeMartianTurn() {
        if (this.currentTurn !== "M") return;
        this.logMsg("--- Zug der Marsianer ---", "martian");

        if (!this.drawnCard) {
            this.logMsg("Fehler: Keine Kampfkarte vorhanden.", "danger");
            this.endTurn();
            return;
        }

        const actions = this.drawnCard.actions;

        this.tripods.forEach(t => {
            const action = actions[t.color];
            if (!action) return;

            this.logMsg(`Dreibeiner (${t.color.toUpperCase()}) führt Aktion aus: ${action.replace("_", " ")}`, "martian");
            this.executeTripodAction(t, action);
        });

        this.endTurn();
    }

    executeTripodAction(t, action) {
        switch(action) {
            case "move":
                this.moveTripodDown(t, 1);
                break;
            case "double_move":
                this.moveTripodDown(t, 2);
                break;
            case "detect":
                this.rollToDetect(t, 1);
                break;
            case "focused_detect":
                this.focusedDetect(t);
                break;
            case "detect_all":
                this.rollToDetect(t, 99); // all within range
                break;
            case "attack":
                this.tripodAttack(t, 1);
                break;
            case "focused_fire":
                this.focusedFire(t);
                break;
            case "fire_all":
                this.tripodAttack(t, 99); // all revealed within range
                break;
            case "arrival":
                this.spawnTripodReinforcement();
                break;
            case "high_activity":
                this.rollToDetect(t, 2);
                this.tripodAttack(t, 2);
                break;
        }
    }

    moveTripodDown(t, hexes) {
        const oldRow = t.row;
        t.row = Math.min(4, t.row + hexes);
        this.logMsg(`Tripod (${t.color}) bewegt sich von Reihe ${oldRow+1} nach Reihe ${t.row+1}.`, "martian");

        // If Tripod reaches row 5 (row index 4), it clashes with guns!
        if (t.row === 4) {
            const targetGun = this.units.find(u => u.col === t.col && u.row === 4);
            if (targetGun) {
                this.logMsg(`Nahkampf! Tripod zerquetscht Geschütz in Spalte ${String.fromCharCode(65 + t.col)}.`, "danger");
                this.destroyHumanUnit(targetGun);
            } else {
                // Tripod reaches row 5 with no gun - causes massive destruction!
                this.state.addMartianVp(1);
                this.logMsg("Tripod durchbricht die Linie und verursacht Panik! +1 Marsianer-Siegpunkt.", "danger");
            }
        }
    }

    rollToDetect(t, maxTargets) {
        const inRangeGuns = this.units.filter(u => !u.revealed && this.getDistance(t, u) <= t.maxRange);
        if (inRangeGuns.length === 0) return;

        let targets = inRangeGuns.slice(0, maxTargets);
        targets.forEach(gun => {
            // Roll custom die: Green/Yellow/Red
            const roll = this.state.rollCustomDie();
            // In the rules, a detect succeeds on Green or Yellow (4/6)
            if (roll === "green" || roll === "yellow") {
                gun.revealed = true;
                this.logMsg(`Erfolg! Geschütz in Spalte ${String.fromCharCode(65 + gun.col)} wurde aufgedeckt.`, "martian");
            } else {
                this.logMsg(`Fehlschlag beim Aufdecken des Geschützes in Spalte ${String.fromCharCode(65 + gun.col)}.`, "system");
            }
        });
    }

    focusedDetect(t) {
        // Automatically succeeds at Detect against the nearest Gun
        const hiddenGuns = this.units.filter(u => !u.revealed);
        if (hiddenGuns.length === 0) return;

        // Find nearest
        hiddenGuns.sort((a, b) => this.getDistance(t, a) - this.getDistance(t, b));
        const nearest = hiddenGuns[0];
        nearest.revealed = true;
        this.logMsg(`Präzisions-Detektion! Nächstgelegenes Geschütz in Spalte ${String.fromCharCode(65 + nearest.col)} wurde automatisch aufgedeckt.`, "martian");
    }

    tripodAttack(t, maxTargets) {
        const revealedGuns = this.units.filter(u => u.revealed && this.getDistance(t, u) <= t.maxRange);
        if (revealedGuns.length === 0) return;

        let targets = revealedGuns.slice(0, maxTargets);
        targets.forEach(gun => {
            // Roll for damage: Hit on Green/Yellow (4/6)
            const roll = this.state.rollCustomDie();
            if (roll === "green" || roll === "yellow") {
                this.applyDamageToGun(gun, 1);
            } else {
                this.logMsg(`Hitzestrahl verfehlt Geschütz in Spalte ${String.fromCharCode(65 + gun.col)}.`, "system");
            }
        });
    }

    focusedFire(t) {
        // Fires at a Revealed Gun in Range (closest first)
        const targets = this.units.filter(u => u.revealed && this.getDistance(t, u) <= t.maxRange);
        if (targets.length === 0) return;

        targets.sort((a, b) => this.getDistance(t, a) - this.getDistance(t, b));
        const closest = targets[0];
        
        const roll = this.state.rollCustomDie();
        if (roll === "green" || roll === "yellow") {
            this.applyDamageToGun(closest, 1);
        } else {
            this.logMsg(`Fokusfeuer verfehlt Geschütz in Spalte ${String.fromCharCode(65 + closest.col)}.`, "system");
        }
    }

    applyDamageToGun(gun, damage) {
        if (gun.earthworks > 0) {
            gun.earthworks = Math.max(0, gun.earthworks - damage);
            this.logMsg(`Geschütz in Spalte ${String.fromCharCode(65 + gun.col)} geschützt durch Verschanzung (Earthworks -1).`, "human");
        } else {
            gun.damage += damage;
            this.logMsg(`Direkter Treffer! Geschütz in Spalte ${String.fromCharCode(65 + gun.col)} nimmt 1 Schaden!`, "danger");
            if (gun.damage >= 1) { // 1 damage destroys a gun in rules
                this.destroyHumanUnit(gun);
            }
        }
    }

    destroyHumanUnit(gun) {
        this.units = this.units.filter(u => u.id !== gun.id);
        this.logMsg(`GESCHÜTZ IN SPALTE ${String.fromCharCode(65 + gun.col)} WURDE ZERSTÖRT!`, "danger");
        
        // Remove from map zone list as well
        const mapZone = this.state.map.zones[this.zoneName];
        if (mapZone) {
            mapZone.units = mapZone.units.filter(u => u.id !== gun.id);
        }
    }

    spawnTripodReinforcement() {
        const colors = ["green", "yellow", "red"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.tripods.push({
            color: randomColor,
            damaged: false,
            col: 2, // Hex C1 (col index 2, row index 0)
            row: 0,
            maxRange: this.getTripodRange(randomColor)
        });
        this.logMsg(`Ein neuer ${randomColor.toUpperCase()}-Tripod erscheint als Welle-Verstärkung in Hex C1.`, "martian");
    }

    /**
     * Executes the Human attack at a specific target tripod
     */
    fireAtTripod(gunId, tripodIndex, usedPlanId = null) {
        if (this.currentTurn !== "H") return;
        const gun = this.units.find(u => u.id === gunId);
        const tripod = this.tripods[tripodIndex];

        if (!gun || !tripod) return;

        const distance = this.getDistance(gun, tripod);
        
        this.logMsg(`Menschheit feuert mit ${gun.type === "siegegun" ? "Belagerungskanone" : "Feldgeschütz"} auf ${tripod.color}-Tripod.`, "human");

        // Roll dice: Field Gun rolls 1, Siege Gun rolls 2
        let numDice = gun.type === "siegegun" ? 2 : 1;
        
        // Apply battle plans modifiers
        let explosiveShell = false;
        if (usedPlanId) {
            const plan = this.state.activeBattlePlans.find(p => p.id === usedPlanId);
            if (plan && !plan.used) {
                if (usedPlanId === "surprise_shot") {
                    numDice += 2;
                    this.logMsg("Schlachtplan 'Surprise Shot' aktiviert! +2 Extrawürfel.", "human");
                } else if (usedPlanId === "explosive_shell") {
                    explosiveShell = true;
                    this.logMsg("Schlachtplan 'Explosive Shell' aktiviert! 1 Schaden wird sofort tödlich.", "human");
                }
                plan.used = true;
            }
        }

        let hits = 0;
        for (let i = 0; i < numDice; i++) {
            const roll = this.state.rollCustomDie();
            // Guns hit on Red or Yellow (usually 4+ or 5+)
            // Let's say: Red (1/6) or Yellow (2/6) or Green (3/6) depending on distance:
            // Range 1-2: Hit on Yellow or Red (3/6 chance).
            // Range 3: Hit on Red only (1/6 chance).
            let hit = false;
            if (distance <= 2) {
                if (roll === "red" || roll === "yellow") hit = true;
            } else {
                if (roll === "red") hit = true;
            }

            if (hit) hits++;
        }

        if (hits > 0) {
            this.logMsg(`Treffer erzielt! (${hits} Treffer)`, "human");
            this.applyDamageToTripod(tripod, hits, explosiveShell, tripodIndex);
        } else {
            this.logMsg("Artilleriefeuer verfehlt das Ziel.", "system");
        }
    }

    applyDamageToTripod(tripod, hits, explosiveShell, tripodIndex) {
        if (explosiveShell || hits >= 2 || tripod.damaged) {
            // Destroyed!
            this.tripods.splice(tripodIndex, 1);
            this.logMsg(`MARSIANISCHER ${tripod.color.toUpperCase()}-TRIPOD WURDE VERNICHTET!`, "human");
            this.state.addHumanVp(1); // +1 VP for destroying a tripod!
        } else {
            // Flip to damaged side
            tripod.damaged = true;
            this.logMsg(`Tripod (${tripod.color}) wurde beschädigt.`, "human");
        }
    }

    /**
     * Ends the current turn and alternates or goes to next round
     */
    endTurn() {
        if (this.currentTurn === this.initiative) {
            // Second player acts
            this.currentTurn = this.initiative === "H" ? "M" : "H";
            if (this.currentTurn === "M") {
                // Martians act automatically
                setTimeout(() => this.executeMartianTurn(), 800);
            }
        } else {
            // End of round
            this.round++;
            this.logMsg(`--- Kampfrunde ${this.round} beginnt ---`, "system");

            // Draw new card
            this.drawBattleCard();

            // Check if battle over (no tripods or no guns left)
            this.checkBattleStatus();
        }
    }

    checkBattleStatus() {
        if (this.tripods.length === 0) {
            this.logMsg(`SIEG! Alle marsianischen Einheiten in ${this.zoneName} wurden vernichtet.`, "human");
            this.endBattle(true);
        } else if (this.units.length === 0) {
            this.logMsg(`NIEDERLAGE! Alle menschlichen Verteidigungslinien in ${this.zoneName} sind zusammengebrochen.`, "danger");
            this.endBattle(false);
        }
    }

    endBattle(humanWon) {
        this.active = false;
        
        // Remove destroyed tripods from the map wave
        const wave = this.state.waves[this.zoneName];
        if (wave) {
            wave.tripods = this.tripods.map(t => ({
                color: t.color,
                damaged: t.damaged
            }));
            if (wave.tripods.length === 0) {
                delete this.state.waves[this.zoneName];
                this.logMsg("Marsianische Welle komplett aufgerieben.", "human");
            }
        }

        // Return to strategic map
        if (this.state.battleCallback) {
            this.state.battleCallback(humanWon);
        }
    }

    /**
     * Helper to compute hex-grid distance (Pointy-topped staggered coordinates)
     */
    getDistance(a, b) {
        // Convert offset coordinates (col, row) to axial coordinates (q, r)
        const q1 = a.col;
        const r1 = a.row - Math.floor(a.col / 2);
        const q2 = b.col;
        const r2 = b.row - Math.floor(b.col / 2);
        
        // Cube coordinates distance
        const x1 = q1;
        const z1 = r1;
        const y1 = -x1 - z1;
        const x2 = q2;
        const z2 = r2;
        const y2 = -x2 - z2;
        
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
    }
}
