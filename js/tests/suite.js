/**
 * Test Suite for 'The War of the Worlds' board game logic
 */
import { gameState } from "../game.js";

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

    return results;
}
