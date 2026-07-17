/**
 * Map Configuration & Logic for 'The War of the Worlds'
 */

// Coordinates on map.jpg (1000x862 px) as percentages for responsive overlay
export const ZONES_CONFIG = {
    "Scotland": { x: 45, y: 12, gearsColor: "yellow", maxGears: 4, label: "Scotland" },
    "Newcastle": { x: 62, y: 19, gearsColor: "green", maxGears: 6, label: "Newcastle" },
    "Liverpool": { x: 34, y: 33, gearsColor: "green", maxGears: 6, label: "Liverpool" },
    "Leeds": { x: 53, y: 29, gearsColor: "green", maxGears: 6, label: "Leeds" },
    "Wales": { x: 23, y: 49, gearsColor: "yellow", maxGears: 4, label: "Wales" },
    "Leicester": { x: 51, y: 46, gearsColor: "green", maxGears: 6, label: "Leicester" },
    "Norwich": { x: 74, y: 47, gearsColor: "green", maxGears: 5, label: "Norwich" },
    "Bristol": { x: 30, y: 64, gearsColor: "green", maxGears: 3, label: "Bristol" },
    "Southampton": { x: 46, y: 73, gearsColor: "green", maxGears: 5, label: "Southampton" },
    "Birmingham": { x: 41, y: 53, gearsColor: "green", maxGears: 6, label: "Birmingham" },
    "London": { x: 66, y: 67, gearsColor: "blue", maxGears: 10, label: "London" }
};

// Wave Movement Table (transcribed from Player Help Sheet)
export const MOVEMENT_TABLE = {
    "Scotland": { green: "Newcastle", yellow: "Liverpool", red: "Newcastle" },
    "Wales": { green: "Birmingham", yellow: "Bristol", red: "Bristol" },
    "Leicester": { green: "Norwich", yellow: "Southampton", red: "Birmingham" },
    "Leeds": { green: "Liverpool", yellow: "Leicester", red: "Leicester" },
    "Norwich": { green: "London", yellow: "Southampton", red: "London" },
    "Bristol": { green: "Southampton", yellow: "Southampton", red: "Birmingham" },
    "Newcastle": { green: "Liverpool", yellow: "Leeds", red: "Leeds" },
    "Liverpool": { green: "Leicester", yellow: "Birmingham", red: "Wales" },
    "Southampton": { green: "London", yellow: "London", red: "Norwich" },
    "Birmingham": { green: "Southampton", yellow: "Bristol", red: "Southampton" }
};

// Harbor locations on the strategic map (which zones contain harbors)
export const HARBOR_SITES = ["Southampton", "Bristol", "Norwich", "Liverpool", "Newcastle"];

export class MapManager {
    constructor() {
        this.zones = {};
        this.reset();
    }

    reset() {
        for (const [name, config] of Object.entries(ZONES_CONFIG)) {
            this.zones[name] = {
                name: name,
                gears: config.maxGears,
                maxGears: config.maxGears,
                gearsColor: config.gearsColor,
                refugees1: 0,
                refugees2: 0,
                destroyed: false,
                redweed: false,
                handlingMachine: null, // null or color: 'green', 'yellow', 'red'
                cylinder: false,
                units: [] // list of units: { type: 'infantry'|'cavalry'|'fieldgun'|'siegegun', id: Number }
            };
        }
    }

    /**
     * Determines adjacent zone for a wave movement based on a roll
     * @param {string} currentZone 
     * @param {string} rollColor 'green'|'yellow'|'red'
     * @returns {string} nextZone
     */
    getMovementDestination(currentZone, rollColor) {
        if (currentZone === "London") return "London"; // London is final
        const targets = MOVEMENT_TABLE[currentZone];
        if (!targets) return "London";
        return targets[rollColor];
    }

    /**
     * Devastate a zone: reduce workforce (gears), flip/rotate counter, spawn refugees
     */
    applyWorkforceDamage(zoneName, amount, refugeeType = 0, refugeeCount = 0) {
        const zone = this.zones[zoneName];
        if (!zone || zone.destroyed || zone.redweed) return;

        zone.gears = Math.max(0, zone.gears - amount);
        
        // Spawn refugees
        if (refugeeCount > 0) {
            if (refugeeType === 1) {
                zone.refugees1 += refugeeCount;
            } else if (refugeeType === 2) {
                zone.refugees2 += refugeeCount;
            }
        }

        // Check if destroyed
        if (zone.gears === 0) {
            zone.destroyed = true;
            zone.units = []; // destroy all human units in destroyed zone!
        }
    }

    /**
     * Handles event when a zone flips from Destroyed to Red Weed
     */
    convertToRedWeed(zoneName) {
        const zone = this.zones[zoneName];
        if (zone && zone.destroyed) {
            zone.redweed = true;
        }
    }

    /**
     * Get adjacent zones list based on movement table connections (undirected graph representation)
     */
    getNeighbors(zoneName) {
        const neighbors = new Set();
        
        // Check outgoing movements
        const paths = MOVEMENT_TABLE[zoneName];
        if (paths) {
            neighbors.add(paths.green);
            neighbors.add(paths.yellow);
            neighbors.add(paths.red);
        }
        
        // Check incoming movements from other zones
        for (const [startZone, targets] of Object.entries(MOVEMENT_TABLE)) {
            if (targets.green === zoneName || targets.yellow === zoneName || targets.red === zoneName) {
                neighbors.add(startZone);
            }
        }
        
        return Array.from(neighbors).filter(n => n !== zoneName);
    }
}
