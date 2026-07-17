/**
 * Main Game State Machine for 'The War of the Worlds'
 */
import { MapManager } from "./map.js";
import { EventDeck } from "./event_cards.js";
import { BattleDeck } from "./battle_cards.js";
import { BattleManager } from "./battle.js";
import { NavalManager } from "./naval.js";

export class GameState {
    constructor() {
        this.map = new MapManager();
        this.eventDeck = new EventDeck();
        this.battleDeck = new BattleDeck();
        
        this.battle = new BattleManager(this);
        this.naval = new NavalManager(this);

        this.reset();
    }

    reset() {
        this.scenario = "core";
        this.phase = "production"; // 'production', 'devastation', 'battle', 'humanAction', 'escape', 'martianAction', 'assembly', 'event'
        this.round = 1;
        
        this.pp = 0;
        this.hVp = 0;
        this.mVp = 0;
        
        this.germs = 0;
        this.colonization = 0;
        this.fm = 0; // Flying Machine parts (0 to 4)
        
        this.hmsThunderchildAvailable = false;
        
        // Active Martian waves in zones: key = zoneName, value = { tripods: [{color, damaged}] }
        this.waves = {};
        
        // Cylinders on map: list of { zoneName, tripodsCount (starts at 4) }
        this.cylinders = [];
        
        // Character locations: key = charName ('Curate', 'Heliograph', 'Narrator'), value = zoneName
        this.characters = {};
        
        // Stationary weapons (like the 95t Gun)
        this.stationaryWeapons = []; // list of { type: '95t_gun', zoneName }

        this.logHistory = [];
        
        this.map.reset();
        this.eventDeck.reset();
        this.battleDeck.reset();
        this.battle.reset();
        this.naval.reset();
        
        this.unitIdCounter = 1;
    }

    log(msg, side = "system") {
        this.logHistory.push({ msg, side, round: this.round, phase: this.phase });
        if (this.logCallback) {
            this.logCallback(msg, side);
        }
    }

    /**
     * Spawns a character counter in a zone
     */
    spawnCharacter(name, zoneName) {
        this.characters[name] = zoneName;
    }

    /**
     * Spawns the super 95-ton gun
     */
    spawn95tGun(zoneName) {
        this.stationaryWeapons.push({
            type: "95t_gun",
            zoneName: zoneName
        });
    }

    /**
     * Start a new game with selected scenario configurations
     */
    startNewGame(scenario = "core") {
        this.reset();
        this.scenario = scenario;
        
        this.log(`Neues Spiel begonnen: Szenario "${scenario.toUpperCase()}".`, "system");

        // Initial setup for Core Game
        if (scenario === "core") {
            // Wales starts with 5 extra PP, Bristol starts with 10 extra PP
            this.pp = 15;
            
            // Set up initial Handling Machines:
            // Scotland (Green HM), Wales (Yellow HM), Bristol (Red HM)
            this.map.zones["Scotland"].handlingMachine = "green";
            this.map.zones["Wales"].handlingMachine = "yellow";
            this.map.zones["Bristol"].handlingMachine = "red";
            
            this.log("Initiales Setup: Handling Machines in Scotland (Grün), Wales (Gelb), Bristol (Rot) platziert.", "system");

            // Deploy starting Cylinder (rolled at setup)
            this.deployNewCylinder("Scotland");
            
            // Place starting units
            this.buyUnitDirectly("infantry", "London");
            this.buyUnitDirectly("fieldgun", "London");
        } else if (scenario === "ironclads") {
            // Scenario I: No Handling Machines, but 5 tripods per wave.
            this.pp = 0;
            this.log("Szenario Ironclads: Keine Handling Machines, erhöhte Bedrohung zur See.", "danger");
            this.deployNewCylinder("Wales");
        } else if (scenario === "uprising") {
            // Scenario II: 4 green Handling Machines start.
            this.map.zones["Scotland"].handlingMachine = "green";
            this.map.zones["Leeds"].handlingMachine = "green";
            this.map.zones["Leicester"].handlingMachine = "green";
            this.map.zones["Norwich"].handlingMachine = "green";
            this.deployNewCylinder("Leicester");
        } else if (scenario === "crisis") {
            this.pp = 10;
            this.map.zones["Southampton"].refugees1 = 4;
            this.map.zones["London"].refugees2 = 2;
            this.deployNewCylinder("Scotland");
        }

        // Set initial phase
        this.phase = "production";
        this.startPhase();
    }

    deployNewCylinder(zoneName) {
        this.cylinders.push({
            zoneName: zoneName,
            tripodsCount: 4
        });
        this.map.zones[zoneName].cylinder = true;
        this.log(`Ein marsianischer Zylinder schlägt in ${zoneName} ein! (4 Tripods im Bau)`, "martian");
    }

    buyUnitDirectly(type, zoneName) {
        const zone = this.map.zones[zoneName];
        if (!zone) return;
        
        const newUnit = {
            id: this.unitIdCounter++,
            type: type,
            zone: zoneName
        };
        zone.units.push(newUnit);
        return newUnit;
    }

    startPhase() {
        this.log(`--- PHASE: ${this.phase.toUpperCase()} (Runde ${this.round}) ---`, "system");

        if (this.phase === "production") {
            // 1. Calculate production PP from gears
            let producedPP = 0;
            for (const [name, zone] of Object.entries(this.map.zones)) {
                if (!zone.destroyed) {
                    producedPP += zone.gears;
                }
            }
            this.pp += producedPP;
            this.log(`Einkommensphase: +${producedPP} PP aus aktiven Industrie-Zonen.`, "human");
        } 
        else if (this.phase === "devastation") {
            this.executeDevastationPhase();
        } 
        else if (this.phase === "battle") {
            this.executeBattlePhase();
        }
        else if (this.phase === "escape") {
            // Escape checks are handled manually by user action in UI, but landing of new cylinders happens here
            this.log("Bereit für Evakuierungen an Häfen.", "system");
        }
        else if (this.phase === "martianAction") {
            this.executeMartianActionPhase();
        }
        else if (this.phase === "assembly") {
            this.executeAssemblyPhase();
        }
        else if (this.phase === "event") {
            this.executeEventPhase();
        }

        if (this.uiUpdateCallback) {
            this.uiUpdateCallback();
        }
    }

    nextPhase() {
        const phases = ["production", "devastation", "battle", "humanAction", "escape", "martianAction", "assembly", "event"];
        let idx = phases.indexOf(this.phase);
        idx = (idx + 1) % phases.length;
        
        this.phase = phases[idx];
        
        if (this.phase === "production") {
            this.round++;
            this.checkVictoryOrLoss();
        }

        this.startPhase();
    }

    /**
     * Devastation Table implementation based on wave size and roll
     */
    executeDevastationPhase() {
        this.log("Verwüstungsangriffe der Dreibeiner-Wellen beginnen...", "martian");

        for (const [zoneName, wave] of Object.entries(this.waves)) {
            const numTripods = wave.tripods.length;
            if (numTripods === 0) continue;

            const roll = this.rollCustomDie();
            const zone = this.map.zones[zoneName];

            this.log(`Welle in ${zoneName} (${numTripods} Tripods) würfelt ${roll.toUpperCase()} zur Verwüstung.`, "martian");

            if (numTripods >= 5) {
                if (roll === "green") {
                    this.log("Verwüstung: Infanterie oder Stellungen vernichtet. -5 Gears.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 5, 1, 5);
                } else if (roll === "yellow") {
                    this.log("Verwüstung: Schwere Industrieschäden. -7 Gears.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 7, 1, 2);
                } else {
                    this.log("Verwüstung: Vernichtungsschlag! -7 Gears, Flüchtlingspanik.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 7, 1, 5);
                }
            } 
            else if (numTripods === 4) {
                if (roll === "green") {
                    this.log("Verwüstung: -3 Gears, 3 Flüchtlinge.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 3, 1, 3);
                } else if (roll === "yellow") {
                    this.log("Verwüstung: -4 Gears, 2 Flüchtlinge.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 4, 1, 2);
                } else {
                    this.log("Verwüstung: -2 Gears, 4 Flüchtlinge, -2 Human VPs.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 2, 1, 4);
                    this.addHumanVp(-2);
                }
            }
            else if (numTripods === 3) {
                if (roll === "green") {
                    this.log("Verwüstung: -1 Unit, -1 Gear.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 1, 1, 2);
                } else if (roll === "yellow") {
                    this.log("Verwüstung: -1 Unit, -2 Gears.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 2, 1, 1);
                } else {
                    this.log("Verwüstung: -1 Gear, 2 Flüchtlinge, -1 Human VP.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 1, 1, 2);
                    this.addHumanVp(-1);
                }
            }
            else if (numTripods === 2) {
                if (roll === "green") {
                    this.log("Verwüstung: -1 Gear, 2 Flüchtlinge.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 1, 1, 2);
                } else if (roll === "yellow") {
                    this.log("Verwüstung: -2 Gears, 1 Flüchtling.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 2, 1, 1);
                } else {
                    this.log("Verwüstung: -1 Gear, 3 Flüchtlinge, -1 Human VP.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 1, 1, 3);
                    this.addHumanVp(-1);
                }
            }
            else { // 1 Tripod
                if (roll === "green") {
                    this.log("Verwüstung: Geringe Unruhen. 3 Flüchtlinge.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 0, 1, 3);
                } else if (roll === "yellow") {
                    this.log("Verwüstung: Zerstörung von Lagerhäusern. -3 Gears.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 3, 1, 1);
                } else {
                    this.log("Verwüstung: Panik. -1 Human VP, 3 Flüchtlinge.", "danger");
                    this.map.applyWorkforceDamage(zoneName, 0, 1, 3);
                    this.addHumanVp(-1);
                }
            }
        }

        // Auto transition to next phase after short delay (let user read logs)
        setTimeout(() => this.nextPhase(), 2000);
    }

    executeBattlePhase() {
        // Find zones that contain BOTH a Martian Wave and Human military guns
        const battles = [];
        for (const [zoneName, wave] of Object.entries(this.waves)) {
            if (wave.tripods.length > 0) {
                const zone = this.map.zones[zoneName];
                const guns = zone.units.filter(u => u.type === "fieldgun" || u.type === "siegegun");
                if (guns.length > 0) {
                    battles.push(zoneName);
                }
            }
        }

        if (battles.length > 0) {
            this.log(`Schlachten in folgenden Zonen entdeckt: ${battles.join(", ")}. Wechsel zum taktischen Kampfschirm.`, "system");
            // Start the first battle
            this.battle.startLandBattle(battles[0]);
        } else {
            this.log("Keine Landschlachten in dieser Runde.", "system");
            setTimeout(() => this.nextPhase(), 1200);
        }
    }

    /**
     * Martian Action Phase AI behavior based on Zone Gears color
     */
    executeMartianActionPhase() {
        this.log("Marsianer-AI führt Aktionen aus...", "martian");

        for (const [zoneName, wave] of Object.entries(this.waves)) {
            if (wave.tripods.length === 0) continue;

            const zone = this.map.zones[zoneName];
            const gearsColor = zone.destroyed ? "destroyed" : zone.gearsColor;
            
            const roll = this.rollCustomDie();

            this.log(`Welle in ${zoneName} würfelt ${roll.toUpperCase()} (Gears: ${gearsColor.toUpperCase()}).`, "martian");

            if (gearsColor === "yellow") {
                if (roll === "green") this.moveMartianWave(zoneName);
                else if (roll === "yellow") this.spawnTripodToWave(zoneName);
                else this.repairTripodInWave(zoneName);
            } 
            else if (gearsColor === "green") {
                if (roll === "green") this.moveMartianWave(zoneName);
                else if (roll === "yellow") this.repairTripodInWave(zoneName);
                else this.moveMartianWave(zoneName);
            }
            else if (gearsColor === "blue") {
                if (roll === "green") this.repairTripodInWave(zoneName);
                else this.buildFlyingMachinePart();
            }
            else { // Destroyed / Red Weed
                if (roll === "green") this.moveMartianWave(zoneName);
                else if (roll === "yellow") this.spawnTripodToWave(zoneName);
                else this.buildFlyingMachinePart();
            }
        }

        setTimeout(() => this.nextPhase(), 2000);
    }

    moveMartianWave(zoneName) {
        const roll = this.rollCustomDie();
        const nextZone = this.map.getMovementDestination(zoneName, roll);
        
        if (nextZone === "London") {
            this.log(`KATASTROPHE! Eine marsianische Welle ist in London einmarschiert!`, "danger");
            this.colonization = 10; // loss condition
            return;
        }

        this.log(`Welle bewegt sich von ${zoneName} nach ${nextZone} (Weg-Wurf: ${roll.toUpperCase()}).`, "martian");

        // Move wave state to next zone
        const wave = this.waves[zoneName];
        if (wave) {
            if (this.waves[nextZone]) {
                // Merge waves
                this.waves[nextZone].tripods.push(...wave.tripods);
            } else {
                this.waves[nextZone] = wave;
            }
            delete this.waves[zoneName];
        }
    }

    spawnTripodToWave(zoneName) {
        const wave = this.waves[zoneName];
        if (wave && wave.tripods.length < 5) {
            const colors = ["green", "yellow", "red"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            wave.tripods.push({ color: color, damaged: false });
            this.log(`Zylinder liefert Verstärkung. +1 ${color.toUpperCase()}-Tripod in Welle ${zoneName}.`, "martian");
        }
    }

    repairTripodInWave(zoneName) {
        const wave = this.waves[zoneName];
        if (wave) {
            const damaged = wave.tripods.find(t => t.damaged);
            if (damaged) {
                damaged.damaged = false;
                this.log(`Marsianer reparieren 1 beschädigten Tripod in ${zoneName}.`, "martian");
            }
        }
    }

    buildFlyingMachinePart() {
        this.fm = Math.min(4, this.fm + 1);
        this.log(`Marsianer bauen Teil der Flugmaschine! (Fortschritt: ${this.fm}/4)`, "danger");
    }

    /**
     * Assembly Phase: inactive Cylinders check if they assemble into waves
     */
    executeAssemblyPhase() {
        this.log("Montage-Phase: Zylinder prüfen auf Zusammenbau...", "martian");

        const assembledIndices = [];
        this.cylinders.forEach((cyl, idx) => {
            const zone = this.map.zones[cyl.zoneName];
            const hmColor = zone.handlingMachine;

            if (hmColor) {
                // Roll die: If matches handling machine color, assembly succeeds!
                const roll = this.rollCustomDie();
                this.log(`Zylinder in ${cyl.zoneName} rollt ${roll.toUpperCase()} (Handling Machine: ${hmColor.toUpperCase()}).`, "martian");
                
                if (roll === hmColor) {
                    assembledIndices.push(idx);
                }
            }
        });

        // Resolve assemblies (reverse order to keep indices valid)
        for (let i = assembledIndices.length - 1; i >= 0; i--) {
            const idx = assembledIndices[i];
            const cyl = this.cylinders[idx];
            
            // Remove cylinder
            this.cylinders.splice(idx, 1);
            this.map.zones[cyl.zoneName].cylinder = false;

            // Spawn wave with 4 tripods (1 green, 1 yellow, 1 red, 1 black/blue depending on scenario)
            this.waves[cyl.zoneName] = {
                tripods: [
                    { color: "green", damaged: false },
                    { color: "yellow", damaged: false },
                    { color: "red", damaged: false },
                    { color: "green", damaged: false }
                ]
            };

            this.log(`Zylinder in ${cyl.zoneName} ist betriebsbereit! Eine neue aktive Mars-Invasionswelle (4 Tripods) ist entstanden!`, "danger");
        }

        if (assembledIndices.length === 0) {
            this.log("Keine Zylinder montiert in dieser Runde.", "system");
        }

        setTimeout(() => this.nextPhase(), 1500);
    }

    /**
     * Event Phase: Draw 1 event card and show modal for options
     */
    executeEventPhase() {
        const card = this.eventDeck.draw();
        if (card) {
            if (this.eventCardCallback) {
                this.eventCardCallback(card);
            }
        } else {
            this.log("Keine Ereignisse mehr im Stapel.", "system");
            setTimeout(() => this.nextPhase(), 1200);
        }
    }

    /**
     * Custom Die probability simulation (3 Green, 2 Yellow, 1 Red)
     */
    rollCustomDie() {
        const roll = Math.floor(Math.random() * 6);
        if (roll < 3) return "green";   // 50%
        if (roll < 5) return "yellow";  // 33.3%
        return "red";                   // 16.7%
    }

    addHumanVp(amount) {
        this.hVp = Math.max(0, this.hVp + amount);
        
        // Spawn a new Cylinder when human reaches 2, 4, 6, 8 VPs!
        if (amount > 0 && [2, 4, 6, 8].includes(this.hVp)) {
            this.triggerNewCylinderLanding();
        }
    }

    addMartianVp(amount) {
        this.mVp = Math.max(0, this.mVp + amount);
    }

    triggerNewCylinderLanding() {
        const roll = this.rollCustomDie();
        let targetZone = "Scotland";
        if (roll === "yellow") targetZone = "Wales";
        else if (roll === "red") targetZone = "Leicester";
        
        this.log(`Menschlicher Fortschritt alarmiert die Invasoren! Ein neuer Zylinder stürzt ab.`, "danger");
        this.deployNewCylinder(targetZone);
    }

    checkVictoryOrLoss() {
        // Winning condition: Germ counter reaches 10, or successful roll
        // Losing condition: London destroyed, or Colonization reaches 10, or FM assembled
        const london = this.map.zones["London"];
        
        // Check Germ-Sieg
        let humanWon = false;
        if (this.germs >= 10) {
            humanWon = true;
        } else if (this.germs >= 7) {
            const roll = this.rollCustomDie();
            if (this.germs === 7 && roll === "red") humanWon = true;
            else if (this.germs === 8 && (roll === "red" || roll === "yellow")) humanWon = true;
            else if (this.germs === 9) humanWon = true;
        }

        // Check Martian Sieg
        let martiansWon = false;
        if (london.destroyed || london.gears === 0) {
            martiansWon = true;
            this.log("London wurde komplett vernichtet! Die Menschheit hat kapituliert.", "danger");
        } else if (this.colonization >= 10) {
            martiansWon = true;
        } else if (this.fm >= 4) {
            martiansWon = true;
            this.log("Die Marsianer haben ihre Flugmaschine fertiggestellt und beherrschen den Luftraum!", "danger");
        }

        if (humanWon) {
            this.triggerGameOver(true, "Die biologische Abwehrkraft der Erde hat gesiegt! Die Marsianer erliegen den irdischen Bakterien.");
        } else if (martiansWon) {
            this.triggerGameOver(false, "Invasion erfolgreich. Die Zivilisation der Menschheit liegt in Schutt und Asche.");
        }
    }

    triggerGameOver(humanWon, reason) {
        if (this.gameOverCallback) {
            this.gameOverCallback(humanWon, reason);
        }
    }

    // Helper functions for event cards logic
    evacuateRefugeesLogic() {
        const moves = [];
        for (const [name, zone] of Object.entries(this.map.zones)) {
            if (zone.refugees1 > 0 || zone.refugees2 > 0) {
                const neighbors = this.map.getNeighbors(name);
                if (neighbors.length > 0) {
                    const harborNeighbor = neighbors.find(n => this.isHarborZone(n));
                    const target = harborNeighbor || neighbors[0];
                    moves.push({
                        from: name,
                        to: target,
                        r1: zone.refugees1,
                        r2: zone.refugees2
                    });
                }
            }
        }
        
        moves.forEach(m => {
            this.map.zones[m.from].refugees1 -= m.r1;
            this.map.zones[m.from].refugees2 -= m.r2;
            this.map.zones[m.to].refugees1 += m.r1;
            this.map.zones[m.to].refugees2 += m.r2;
        });
    }

    isHarborZone(name) {
        return ["Southampton", "Bristol", "Norwich", "Liverpool", "Newcastle"].includes(name);
    }

    triggerRedWeedSpread() {
        for (const [name, zone] of Object.entries(this.map.zones)) {
            if (zone.destroyed && !zone.redweed) {
                const roll = this.rollCustomDie();
                if (roll === "red") {
                    zone.redweed = true;
                    this.log(`Rotes Kraut breitet sich explosionsartig in ${name} aus!`, "danger");
                }
            }
        }
    }

    sabotageCylinder() {
        if (this.cylinders.length > 0) {
            const cyl = this.cylinders[0];
            cyl.tripodsCount = Math.max(0, cyl.tripodsCount - 1);
            this.log(`Sabotage! 1 Tripod aus dem Zylinder in ${cyl.zoneName} entfernt.`, "human");
        }
    }

    damageRandomTripodOnMap() {
        for (const [zoneName, wave] of Object.entries(this.waves)) {
            const undamaged = wave.tripods.find(t => !t.damaged);
            if (undamaged) {
                undamaged.damaged = true;
                this.log(`Ein Tripod in der Welle ${zoneName} erleidet Systemschaden und wird beschädigt.`, "human");
                break;
            }
        }
    }

    addRandomBattlePlan() {
        if (!this.activeBattlePlans) this.activeBattlePlans = [];
        const plans = [
            { id: "surprise_shot", name: "Surprise Shot (+2 Würfel)", used: false },
            { id: "explosive_shell", name: "Explosive Shell (Instadeath)", used: false }
        ];
        const randomPlan = plans[Math.floor(Math.random() * plans.length)];
        this.activeBattlePlans.push({ ...randomPlan, id: `${randomPlan.id}_${Date.now()}` });
    }

    buyBattlePlan(type) {
        const cost = type === "random" ? 5 : 10;
        if (this.pp < cost) {
            this.log("Nicht genügend PP für einen Schlachtplan.", "system");
            return;
        }
        this.pp -= cost;
        this.addRandomBattlePlan();
        this.log(`Schlachtplan erworben. -${cost} PP.`, "human");
    }
}

// Global game instance
export const gameState = new GameState();
