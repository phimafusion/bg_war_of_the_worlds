/**
 * Test Suite for 'The War of the Worlds' board game logic
 */
import { gameState } from "../game.js";
import { ui } from "../ui.js";

export function runTests() {
    const results = [];

    // Helper to log test result
    const runTest = (name, testFn) => {
        try {
            gameState.reset();
            testFn();
            results.push({ name, passed: true, message: "Erfolgreich abgeschlossen." });
        } catch (err) {
            results.push({ name, passed: false, message: err.message || err });
        }
    };

    // 1. Test Custom Die Probabilities
    runTest("testDiceProbabilities", () => {
        const counts = { green: 0, yellow: 0, red: 0 };
        const rolls = 1000;
        
        for (let i = 0; i < rolls; i++) {
            const roll = gameState.rollCustomDie();
            counts[roll] = (counts[roll] || 0) + 1;
        }

        const greenPct = counts.green / rolls;
        const yellowPct = counts.yellow / rolls;
        const redPct = counts.red / rolls;

        // Tolerance check (+- 5%)
        if (Math.abs(greenPct - 0.50) > 0.06) {
            throw new Error(`Ungültige Wahrscheinlichkeit für Grün: ${(greenPct*100).toFixed(1)}% (Erwartet ~50%)`);
        }
        if (Math.abs(yellowPct - 0.33) > 0.06) {
            throw new Error(`Ungültige Wahrscheinlichkeit für Gelb: ${(yellowPct*100).toFixed(1)}% (Erwartet ~33.3%)`);
        }
        if (Math.abs(redPct - 0.17) > 0.06) {
            throw new Error(`Ungültige Wahrscheinlichkeit für Rot: ${(redPct*100).toFixed(1)}% (Erwartet ~16.7%)`);
        }
    });

    // 2. Test Martian Action Table
    runTest("testMartianActionMatrix", () => {
        // Mock method triggers so we can verify output action logic
        let actionTriggered = "";
        gameState.moveMartianWave = () => { actionTriggered = "move"; };
        gameState.spawnTripodToWave = () => { actionTriggered = "spawn"; };
        gameState.repairTripodInWave = () => { actionTriggered = "repair"; };
        gameState.buildFlyingMachinePart = () => { actionTriggered = "build"; };

        // Test 1: Yellow zone (Scotland)
        gameState.waves["Scotland"] = { tripods: [{ color: "green", damaged: false }] };
        
        // Mock roll to green
        gameState.rollCustomDie = () => "green";
        gameState.executeMartianActionPhase();
        if (actionTriggered !== "move") throw new Error(`Yellow Zone + Green Roll sollte 'move' auslösen, aber war: ${actionTriggered}`);

        // Mock roll to yellow
        gameState.rollCustomDie = () => "yellow";
        gameState.executeMartianActionPhase();
        if (actionTriggered !== "spawn") throw new Error(`Yellow Zone + Yellow Roll sollte 'spawn' auslösen, aber war: ${actionTriggered}`);

        // Mock roll to red
        gameState.rollCustomDie = () => "red";
        gameState.executeMartianActionPhase();
        if (actionTriggered !== "repair") throw new Error(`Yellow Zone + Red Roll sollte 'repair' auslösen, aber war: ${actionTriggered}`);
    });

    // 3. Test Movement Pathing
    runTest("testMovementPathing", () => {
        // Test Scotland destinations
        const nextGreen = gameState.map.getMovementDestination("Scotland", "green");
        const nextYellow = gameState.map.getMovementDestination("Scotland", "yellow");
        const nextRed = gameState.map.getMovementDestination("Scotland", "red");

        if (nextGreen !== "Newcastle") throw new Error(`Scotland -> Green sollte Newcastle sein, war: ${nextGreen}`);
        if (nextYellow !== "Liverpool") throw new Error(`Scotland -> Yellow sollte Liverpool sein, war: ${nextYellow}`);
        if (nextRed !== "Newcastle") throw new Error(`Scotland -> Red sollte Newcastle sein, war: ${nextRed}`);

        // Test Wales destinations
        const walesGreen = gameState.map.getMovementDestination("Wales", "green");
        const walesYellow = gameState.map.getMovementDestination("Wales", "yellow");
        
        if (walesGreen !== "Birmingham") throw new Error(`Wales -> Green sollte Birmingham sein, war: ${walesGreen}`);
        if (walesYellow !== "Bristol") throw new Error(`Wales -> Yellow sollte Bristol sein, war: ${walesYellow}`);
    });

    // 4. Test Refugee Evacuation
    runTest("testRefugeeEvacuation", () => {
        // Place refugees in London
        gameState.map.zones["London"].refugees1 = 2;
        
        // Evacuate
        gameState.evacuateRefugeesLogic();
        
        // Verify they moved to adjacent zones (e.g. Norwich or Southampton)
        const londonRef = gameState.map.zones["London"].refugees1;
        const norwichRef = gameState.map.zones["Norwich"].refugees1;
        const southamptonRef = gameState.map.zones["Southampton"].refugees1;

        if (londonRef !== 0) throw new Error("Flüchtlinge sollten London verlassen haben.");
        if (norwichRef === 0 && southamptonRef === 0) throw new Error("Flüchtlinge wurden nicht in Nachbarzonen verschoben.");
    });

    // 5. Test Land Battle Setup & Tactical calculations
    runTest("testLandBattleResolution", () => {
        // Setup mock human and wave
        gameState.buyUnitDirectly("fieldgun", "Leicester");
        gameState.waves["Leicester"] = {
            tripods: [
                { color: "green", damaged: false },
                { color: "yellow", damaged: false }
            ]
        };

        gameState.battle.startLandBattle("Leicester");

        if (!gameState.battle.active) throw new Error("Schlacht sollte aktiv sein.");
        if (gameState.battle.units.length !== 1) throw new Error("Menschliche Einheiten wurden nicht geladen.");
        if (gameState.battle.tripods.length !== 2) throw new Error("Martianische Einheiten wurden nicht geladen.");

        // Verify distance calculations
        const gun = gameState.battle.units[0];
        gun.col = 2; gun.row = 4; // C5

        const tripod = gameState.battle.tripods[0];
        tripod.col = 2; tripod.row = 2; // C3

        const dist = gameState.battle.getDistance(gun, tripod);
        if (dist !== 2) throw new Error(`Entfernung zwischen C5 und C3 sollte 2 sein, war: ${dist}`);
    });

    // 6. Test Scenario Setups
    runTest("testScenarioSetups", () => {
        // Core setup
        gameState.startNewGame("core");
        if (gameState.pp !== 76) throw new Error(`Core PP Setup fehlgeschlagen: ${gameState.pp} (Erwartet 76 = 15 starting + 61 production)`);
        if (gameState.map.zones["Scotland"].handlingMachine !== "green") throw new Error("Scotland Handling Machine sollte grün sein.");
        if (gameState.map.zones["Wales"].handlingMachine !== "yellow") throw new Error("Wales Handling Machine sollte gelb sein.");
        if (gameState.map.zones["Bristol"].handlingMachine !== "red") throw new Error("Bristol Handling Machine sollte rot sein.");
        if (gameState.cylinders.length !== 1) throw new Error("Core Setup sollte mit 1 Cylinder starten.");

        // Ironclads setup
        gameState.startNewGame("ironclads");
        if (gameState.pp !== 61) throw new Error(`Ironclads PP sollte 61 sein, war: ${gameState.pp}`);
        if (gameState.map.zones["Scotland"].handlingMachine !== null) throw new Error("Ironclads sollte keine Handling Machines haben.");

        // Uprising setup
        gameState.startNewGame("uprising");
        if (gameState.map.zones["Norwich"].handlingMachine !== "green") throw new Error("Uprising sollte grüne Handling Machine in Norwich haben.");
    });

    // 7. Test Devastation Table Outcomes
    runTest("testDevastationTable", () => {
        gameState.startNewGame("core");
        
        // Setup 1 Tripod wave in Leeds (starts with 6 gears)
        gameState.waves["Leeds"] = { tripods: [{ color: "green", damaged: false }] };
        
        // Mock roll to yellow (-3 gears)
        gameState.rollCustomDie = () => "yellow";
        gameState.executeDevastationPhase();
        
        const leedsGears = gameState.map.zones["Leeds"].gears;
        if (leedsGears !== 3) throw new Error(`1 Tripod + Yellow Roll sollte Gears auf 3 senken, war: ${leedsGears}`);
    });

    // 8. Test Cylinder Assembly Phase
    runTest("testAssemblyPhase", () => {
        gameState.startNewGame("core");
        
        // Setup a cylinder and handling machine in Wales (Yellow HM)
        gameState.cylinders = [{ zoneName: "Wales", tripodsCount: 4 }];
        gameState.map.zones["Wales"].cylinder = true;
        gameState.map.zones["Wales"].handlingMachine = "yellow";

        // Mock roll to yellow (matches HM color)
        gameState.rollCustomDie = () => "yellow";
        gameState.executeAssemblyPhase();

        if (gameState.cylinders.length !== 0) throw new Error("Cylinder sollte montiert und aus der Liste entfernt worden sein.");
        if (!gameState.waves["Wales"]) throw new Error("Eine aktive Welle sollte in Wales entstanden sein.");
        if (gameState.waves["Wales"].tripods.length !== 4) throw new Error("Die Welle sollte aus 4 Tripods bestehen.");
    });

    // 9. Test Sea Battle Escape & Freighter Damage
    runTest("testSeaBattleEscape", () => {
        gameState.startNewGame("core");
        
        // Start Sea Battle: 1 Tripod (Green, range 1), 1 type-1 refugee
        gameState.naval.startSeaBattle("Southampton", 1, 1, 0);

        if (!gameState.naval.active) throw new Error("Seeschlacht sollte aktiv sein.");
        if (gameState.naval.freighters.length !== 1) throw new Error("Flüchtlingsschiff sollte platziert sein.");
        if (gameState.naval.tripods.length !== 1) throw new Error("Dreibeiner sollte platziert sein.");

        // Move human: freighter moves B->C
        gameState.naval.executeHumanTurn();
        const freighterCol = gameState.naval.freighters[0].col;
        if (freighterCol !== 2) throw new Error(`Flüchtlingsschiff sollte in Spalte C (2) sein, war: ${freighterCol}`);
    });

    // 10. Test Victory & Loss Conditions
    runTest("testVictoryLossConditions", () => {
        gameState.startNewGame("core");
        
        let gameOverTriggered = false;
        let humanWonState = false;
        gameState.gameOverCallback = (won, reason) => {
            gameOverTriggered = true;
            humanWonState = won;
        };

        // Test 1: Germs victory
        gameState.germs = 10;
        gameState.checkVictoryOrLoss();
        if (!gameOverTriggered || !humanWonState) throw new Error("Biologischer Sieg (Germs >= 10) wurde nicht ausgelöst.");

        // Test 2: London destroyed loss
        gameState.reset();
        gameState.gameOverCallback = (won, reason) => {
            gameOverTriggered = true;
            humanWonState = won;
        };
        gameState.map.zones["London"].destroyed = true;
        gameState.checkVictoryOrLoss();
        if (!gameOverTriggered || humanWonState) throw new Error("Verlust (London zerstört) wurde nicht ausgelöst.");

        // Test 3: Flying Machine loss
        gameState.reset();
        gameState.gameOverCallback = (won, reason) => {
            gameOverTriggered = true;
            humanWonState = won;
        };
        gameState.fm = 4;
        gameState.checkVictoryOrLoss();
        if (!gameOverTriggered || humanWonState) throw new Error("Verlust (FM >= 4) wurde nicht ausgelöst.");
    });

    // 11. Test Cylinder Attacks by Infantry
    runTest("testCylinderAttacks", () => {
        gameState.startNewGame("core");
        
        // Setup cylinder in Leicester
        gameState.cylinders = [{ zoneName: "Leicester", tripodsCount: 4 }];
        gameState.map.zones["Leicester"].cylinder = true;
        
        // Mock select zone
        ui.selectedZone = "Leicester";
        
        // Mock custom die roll to green (success)
        gameState.rollCustomDie = () => "green";
        ui.handleInfantryAction("cylinder");

        const tripodCount = gameState.cylinders[0].tripodsCount;
        if (tripodCount !== 3) throw new Error(`Erfolgreicher Infanterieangriff sollte Tripod-Anzahl auf 3 senken, war: ${tripodCount}`);
    });

    return results;
}
