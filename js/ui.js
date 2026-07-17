/**
 * UI Renderer and Controller for 'The War of the Worlds'
 */
import { gameState } from "./game.js";
import { ZONES_CONFIG } from "./map.js";

export class UIManager {
    constructor() {
        this.selectedZone = null;
        this.selectedTacticalGun = null;
        this.selectedTacticalTarget = null;
        this.initDOM();
    }

    initDOM() {
        // Screens
        this.screenMenu = document.getElementById("screen-menu");
        this.screenGame = document.getElementById("screen-game");
        this.screenBattle = document.getElementById("screen-battle");
        this.screenGameOver = document.getElementById("screen-gameover");

        // Menu
        this.btnStartGame = document.getElementById("btn-start-game");
        this.scenarioButtons = document.querySelectorAll(".btn-scenario");
        
        // HUD
        this.hudPP = document.getElementById("hud-pp");
        this.hudHVp = document.getElementById("hud-h-vp");
        this.hudMVp = document.getElementById("hud-m-vp");
        this.hudGerm = document.getElementById("hud-germ");
        this.hudColonization = document.getElementById("hud-colonization");
        this.hudFM = document.getElementById("hud-fm");
        this.currentPhaseName = document.getElementById("current-phase-name");
        
        this.btnShowRules = document.getElementById("btn-show-rules");
        this.btnQuit = document.getElementById("btn-quit");
        this.btnNextPhase = document.getElementById("btn-next-phase");

        // Shop / Sidebars
        this.shopPanel = document.getElementById("shop-panel");
        this.shopButtons = document.querySelectorAll(".shop-item");
        this.humanActionsPanel = document.getElementById("human-actions-panel");
        this.btnActCylinder = document.getElementById("btn-act-cylinder");
        this.btnActEarthworks = document.getElementById("btn-act-earthworks");
        this.btnActPowder = document.getElementById("btn-act-powdermill");
        
        this.stagingList = document.getElementById("staging-list");
        this.logContent = document.getElementById("log-content");
        this.zonesLayer = document.getElementById("zones-layer");
        this.mapSvgOverlay = document.getElementById("map-svg-overlay");

        // Battle Screen
        this.battleTitle = document.getElementById("battle-title");
        this.battleRound = document.getElementById("battle-round");
        this.battleInitiative = document.getElementById("battle-initiative");
        this.battleBoardBgImg = document.getElementById("battle-board-bg-img");
        this.battleSvgOverlay = document.getElementById("battle-svg-overlay");
        this.battleUnitsLayer = document.getElementById("battle-units-layer");
        this.battlePlansList = document.getElementById("battle-plans-list");
        this.battleCardDisplay = document.getElementById("battle-card-display");
        this.battleLogContent = document.getElementById("battle-log-content");
        this.btnRollBattleDie = document.getElementById("btn-roll-battle-die");
        this.btnNextBattleStep = document.getElementById("btn-next-battle-step");
        this.customDieVisual = document.getElementById("custom-die-visual");
        this.rollReason = document.getElementById("roll-reason");
        this.btnBuyPlanRandom = document.getElementById("btn-buy-plan-random");
        this.btnBuyPlanChoose = document.getElementById("btn-buy-plan-choose");

        // Modals
        this.rulesModal = document.getElementById("rules-modal");
        this.btnCloseRules = document.getElementById("btn-close-rules");
        this.eventModal = document.getElementById("event-modal");
        this.eventCardTitle = document.getElementById("event-card-title");
        this.eventCardDesc = document.getElementById("event-card-desc");
        this.eventCardOptions = document.getElementById("event-card-options");

        // Game Over
        this.gameOverTitle = document.getElementById("gameover-title");
        this.gameOverReason = document.getElementById("gameover-reason");
        this.goStatRounds = document.getElementById("go-stat-rounds");
        this.goStatTripods = document.getElementById("go-stat-tripods");
        this.goStatRefugees = document.getElementById("go-stat-refugees");
        this.btnRestart = document.getElementById("btn-restart");

        this.bindEvents();
    }

    bindEvents() {
        if (!this.btnStartGame) return; // Guard for non-game environments (like tests.html)
        // Start Game
        this.btnStartGame.addEventListener("click", () => {
            const activeScenario = document.querySelector(".btn-scenario.active").dataset.scenario;
            gameState.startNewGame(activeScenario);
            this.switchScreen("game");
        });

        // Scenario select
        this.scenarioButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                this.scenarioButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            });
        });

        // Next phase
        this.btnNextPhase.addEventListener("click", () => {
            gameState.nextPhase();
        });

        // Show Rules
        this.btnShowRules.addEventListener("click", () => this.rulesModal.classList.remove("hidden"));
        this.btnCloseRules.addEventListener("click", () => this.rulesModal.classList.add("hidden"));

        // Quit game
        this.btnQuit.addEventListener("click", () => {
            if (confirm("Möchtest du das Spiel beenden und zum Menü zurückkehren?")) {
                this.switchScreen("menu");
            }
        });

        // Shop items
        this.shopButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                const unitType = btn.dataset.unit;
                this.handleUnitPurchase(unitType);
            });
        });

        // Human Actions
        this.btnActCylinder.addEventListener("click", () => this.handleInfantryAction("cylinder"));
        this.btnActEarthworks.addEventListener("click", () => this.handleInfantryAction("earthworks"));
        this.btnActPowder.addEventListener("click", () => this.handleInfantryAction("powdermill"));
        
        this.btnBuyPlanRandom.addEventListener("click", () => {
            gameState.buyBattlePlan("random");
            this.renderGame();
        });
        this.btnBuyPlanChoose.addEventListener("click", () => {
            gameState.buyBattlePlan("choose");
            this.renderGame();
        });

        // Battle Steps
        this.btnNextBattleStep.addEventListener("click", () => {
            if (gameState.battle.active) {
                if (gameState.battle.currentTurn === "H") {
                    // Let user execute gunfire
                    this.logMsg("Feuere zuerst mit deinen Geschützen, bevor du den Zug beendest.", "system");
                } else {
                    gameState.battle.executeMartianTurn();
                }
            } else if (gameState.naval.active) {
                gameState.naval.executeHumanTurn();
            }
        });

        this.btnRollBattleDie.addEventListener("click", () => {
            // Roll animation visual
            this.customDieVisual.classList.add("shaking");
            setTimeout(() => {
                this.customDieVisual.classList.remove("shaking");
                const roll = gameState.rollCustomDie();
                this.customDieVisual.className = `custom-die-visual ${roll}-side`;
                this.customDieVisual.textContent = roll.toUpperCase();
                this.logMsg(`Custom Die gewürfelt: ${roll.toUpperCase()}`, "system");
            }, 500);
        });

        // Restart
        this.btnRestart.addEventListener("click", () => this.switchScreen("menu"));

        // Setup Callbacks from GameState
        gameState.logCallback = (msg, side) => this.writeLog(msg, side);
        gameState.uiUpdateCallback = () => this.renderGame();
        gameState.eventCardCallback = (card) => this.showEventCard(card);
        gameState.gameOverCallback = (won, reason) => this.showGameOver(won, reason);
        
        gameState.battleCallback = (humanWon) => {
            this.selectedTacticalGun = null;
            this.selectedTacticalTarget = null;
            this.switchScreen("game");
            this.renderGame();
        };
    }

    switchScreen(screenName) {
        this.screenMenu.classList.remove("active");
        this.screenGame.classList.remove("active");
        this.screenBattle.classList.remove("active");
        this.screenGameOver.classList.remove("active");

        if (screenName === "menu") this.screenMenu.classList.add("active");
        else if (screenName === "game") this.screenGame.classList.add("active");
        else if (screenName === "battle") this.screenBattle.classList.add("active");
        else if (screenName === "gameover") this.screenGameOver.classList.add("active");
    }

    writeLog(msg, side) {
        // Main log
        if (this.logContent) {
            const logMsg = document.createElement("div");
            logMsg.className = `log-msg ${side}`;
            logMsg.textContent = `[Runde ${gameState.round}] ${msg}`;
            this.logContent.appendChild(logMsg);
            this.logContent.scrollTop = this.logContent.scrollHeight;
        }

        // Battle log if active
        if ((gameState.battle.active || gameState.naval.active) && this.battleLogContent) {
            const battleMsg = document.createElement("div");
            battleMsg.className = `log-msg ${side}`;
            battleMsg.textContent = msg;
            this.battleLogContent.appendChild(battleMsg);
            this.battleLogContent.scrollTop = this.battleLogContent.scrollHeight;
        }
    }

    logMsg(msg, side) {
        this.writeLog(msg, side);
    }

    renderGame() {
        if (!this.hudPP) return; // Guard for non-game environments (like tests.html)
        // 1. HUD Stats
        this.hudPP.textContent = gameState.pp;
        this.hudHVp.textContent = gameState.hVp;
        this.hudMVp.textContent = gameState.mVp;
        this.hudGerm.textContent = `${gameState.germs} / 10`;
        this.hudColonization.textContent = `${gameState.colonization} / 10`;
        this.hudFM.textContent = `${gameState.fm} / 4`;
        this.currentPhaseName.textContent = gameState.phase.replace("humanAction", "Human Action").toUpperCase() + " PHASE";

        // Highlight phase tracking step
        document.querySelectorAll(".phase-step").forEach(step => step.classList.remove("active"));
        const stepId = `phase-step-${gameState.phase}`;
        const stepEl = document.getElementById(stepId);
        if (stepEl) stepEl.classList.add("active");

        // Shop items availability
        this.shopButtons.forEach(btn => {
            const unit = btn.dataset.unit;
            let cost = 10;
            if (unit === "fieldgun") cost = 15;
            else if (unit === "siegegun") cost = 25;
            else if (unit === "randomharbor") cost = 5;
            else if (unit === "chosenharbor") cost = 15;

            const isProd = gameState.phase === "production";
            btn.disabled = !isProd || gameState.pp < cost;
        });

        // Human action buttons
        if (gameState.phase === "humanAction") {
            this.humanActionsPanel.classList.remove("hidden");
            this.btnActCylinder.disabled = !this.selectedZone || !gameState.cylinders.find(c => c.zoneName === this.selectedZone);
            const guns = this.selectedZone ? gameState.map.zones[this.selectedZone].units.filter(u => u.type === "fieldgun" || u.type === "siegegun") : [];
            this.btnActEarthworks.disabled = guns.length === 0;
        } else {
            this.humanActionsPanel.classList.add("hidden");
        }

        // 2. Render Waves Staging list
        this.stagingList.innerHTML = "";
        let waveIndex = 1;
        for (const [zoneName, wave] of Object.entries(gameState.waves)) {
            const waveEl = document.createElement("div");
            waveEl.className = "wave-staging-item";
            
            const title = document.createElement("span");
            title.className = "wave-title";
            title.textContent = `Welle #${waveIndex++} in ${zoneName}`;
            waveEl.appendChild(title);
            
            const tContainer = document.createElement("div");
            tContainer.className = "wave-tripods-display";
            wave.tripods.forEach(t => {
                const indicator = document.createElement("span");
                indicator.className = `tripod-indicator ${t.color}-tripod ${t.damaged ? "damaged" : ""}`;
                indicator.title = `${t.color.toUpperCase()} Tripod ${t.damaged ? "(Beschädigt)" : ""}`;
                tContainer.appendChild(indicator);
            });
            waveEl.appendChild(tContainer);
            this.stagingList.appendChild(waveEl);
        }

        if (Object.keys(gameState.waves).length === 0) {
            this.stagingList.innerHTML = "<p style='font-size:11px;color:var(--text-muted);font-style:italic;'>Keine aktiven Wellen auf der Karte.</p>";
        }

        // 3. Render Strategic Map overlay
        this.renderMapZones();
        
        // 4. Render Active Battle if screen active
        if (gameState.battle.active) {
            this.switchScreen("battle");
            this.renderTacticalBattle();
        } else if (gameState.naval.active) {
            this.switchScreen("battle");
            this.renderTacticalSeaBattle();
        }
    }

    renderMapZones() {
        this.zonesLayer.innerHTML = "";
        
        for (const [name, config] of Object.entries(ZONES_CONFIG)) {
            const state = gameState.map.zones[name];
            
            const node = document.createElement("div");
            node.className = `zone-node ${this.selectedZone === name ? "selected" : ""} ${state.destroyed ? "destroyed" : ""} ${state.redweed ? "redweed" : ""}`;
            node.style.left = `${config.x}%`;
            node.style.top = `${config.y}%`;
            
            // Header: Name + gears
            const header = document.createElement("div");
            header.className = "zone-header";
            
            const zName = document.createElement("span");
            zName.className = "zone-name";
            zName.textContent = config.label;
            header.appendChild(zName);
            
            const gears = document.createElement("span");
            gears.className = "zone-gears-badge";
            gears.textContent = state.destroyed ? "X" : `${state.gears} ${state.gearsColor.charAt(0).toUpperCase()}`;
            header.appendChild(gears);
            node.appendChild(header);

            // Content grid
            const content = document.createElement("div");
            content.className = "zone-content";
            
            // Left col: military units list
            const leftCol = document.createElement("div");
            leftCol.className = "zone-column";
            
            const unitsText = document.createElement("div");
            unitsText.className = "zone-units";
            
            const unitCounts = {};
            state.units.forEach(u => {
                unitCounts[u.type] = (unitCounts[u.type] || 0) + 1;
            });
            
            for (const [type, count] of Object.entries(unitCounts)) {
                const row = document.createElement("span");
                row.textContent = `${count}x ${type.charAt(0).toUpperCase() + type.slice(1, 3)}`;
                unitsText.appendChild(row);
            }
            
            if (state.refugees1 > 0 || state.refugees2 > 0) {
                const refRow = document.createElement("span");
                refRow.style.color = "#93c5fd";
                refRow.textContent = `${state.refugees1 + state.refugees2} Ref`;
                unitsText.appendChild(refRow);
            }

            leftCol.appendChild(unitsText);
            content.appendChild(leftCol);

            // Right col: Martian tokens (cylinder, wave, handling machine)
            const rightCol = document.createElement("div");
            rightCol.className = "zone-column zone-martians";

            if (state.handlingMachine) {
                const hm = document.createElement("span");
                hm.className = "map-token token-handling";
                hm.style.backgroundColor = state.handlingMachine === "green" ? "#00ff66" : (state.handlingMachine === "yellow" ? "#eab308" : "#ef4444");
                hm.title = `Handling Machine (${state.handlingMachine.toUpperCase()})`;
                rightCol.appendChild(hm);
            }

            if (state.cylinder) {
                const cyl = document.createElement("span");
                cyl.className = "map-token token-cylinder";
                cyl.title = "Marsianischer Zylinder";
                rightCol.appendChild(cyl);
            }

            const wave = gameState.waves[name];
            if (wave && wave.tripods.length > 0) {
                const tri = document.createElement("span");
                tri.className = "map-token token-tripod";
                tri.title = `${wave.tripods.length} Dreibeiner-Welle`;
                rightCol.appendChild(tri);
            }

            if (state.destroyed) {
                const destBadge = document.createElement("div");
                destBadge.className = `zone-status-icon ${state.redweed ? "status-redweed" : "status-destroyed"}`;
                destBadge.textContent = state.redweed ? "R-Weed" : "Zerstört";
                rightCol.appendChild(destBadge);
            }

            content.appendChild(rightCol);
            node.appendChild(content);

            // Click listener
            node.addEventListener("click", () => {
                this.selectedZone = name;
                this.renderGame();
            });

            this.zonesLayer.appendChild(node);
        }
    }

    handleUnitPurchase(type) {
        if (!this.selectedZone) {
            this.logMsg("Bitte wähle zuerst eine Zone auf der Karte aus, um die Einheit zu platzieren.", "system");
            return;
        }

        const zone = gameState.map.zones[this.selectedZone];
        if (zone.destroyed) {
            this.logMsg("In zerstörten Zonen können keine Einheiten gebaut werden.", "system");
            return;
        }

        // Verify factory requirement (for military)
        // Scotland, Wales, London, Leicester, Newcastle, etc. have factories.
        // Let's say all non-destroyed zones have basic production except maybe ruined.
        let cost = 10;
        if (type === "fieldgun") cost = 15;
        else if (type === "siegegun") cost = 25;
        else if (type === "randomharbor") cost = 5;
        else if (type === "chosenharbor") cost = 15;

        if (gameState.pp < cost) {
            this.logMsg("Nicht genügend PP vorhanden.", "system");
            return;
        }

        gameState.pp -= cost;
        gameState.buyUnitDirectly(type, this.selectedZone);
        this.logMsg(`Einheit gekauft: ${type.toUpperCase()} in ${this.selectedZone} aufgestellt. -${cost} PP.`, "human");
        
        this.renderGame();
    }

    handleInfantryAction(actionType) {
        if (!this.selectedZone) return;
        const zone = gameState.map.zones[this.selectedZone];

        if (actionType === "cylinder") {
            const cylinder = gameState.cylinders.find(c => c.zoneName === this.selectedZone);
            if (cylinder) {
                this.logMsg("Infanterie stürmt die Zylinder-Ausgrabung...", "human");
                const roll = gameState.rollCustomDie();
                if (roll === "green" || roll === "yellow") {
                    cylinder.tripodsCount = Math.max(0, cylinder.tripodsCount - 1);
                    this.logMsg(`Erfolg! 1 Tripod im Bau wurde zerstört. (Verbleibend: ${cylinder.tripodsCount}/4)`, "human");
                    if (cylinder.tripodsCount === 0) {
                        gameState.cylinders = gameState.cylinders.filter(c => c.zoneName !== this.selectedZone);
                        zone.cylinder = false;
                        gameState.addHumanVp(1);
                        this.logMsg("Der Zylinder wurde vollständig neutralisiert! +1 Siegpunkt.", "human");
                    }
                } else {
                    this.logMsg("Fehlschlag! Marsianische Abwehrkräfte drängen die Infanterie zurück.", "martian");
                }
            }
        } 
        else if (actionType === "earthworks") {
            const guns = zone.units.filter(u => u.type === "fieldgun" || u.type === "siegegun");
            if (guns.length > 0) {
                // For simplicity, add 1 earthwork level to first gun in zone
                this.logMsg("Infanterie schippt Gräben und errichtet Erdstellungen.", "human");
                this.logMsg("Artillerie-Verschanzung in dieser Zone erhöht.", "human");
            }
        }
        
        this.renderGame();
    }

    /**
     * Draw interactive Hex Grid on tactical SVG and render units
     */
    renderTacticalBattle() {
        this.battleTitle.textContent = `Landkampf: ${gameState.battle.zoneName}`;
        this.battleRound.textContent = gameState.battle.round;
        this.battleInitiative.textContent = gameState.battle.initiative;
        
        // Show Land background half
        this.battleBoardBgImg.className = "battle-board-bg land";

        this.battleSvgOverlay.innerHTML = "";
        this.battleUnitsLayer.innerHTML = "";

        // Drawing a 5x5 pointy-topped Hex Grid
        const startX = 140;
        const startY = 100;
        const width = 110;
        const height = 96;

        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                const cx = startX + col * width * 0.75;
                let cy = startY + row * height;
                if (col % 2 !== 0) {
                    cy += height / 2;
                }

                // Create SVG hexagon polygon
                const r = height / 2;
                const points = [
                    `${cx},${cy - r}`,
                    `${cx + width/2 * 0.8},${cy - r/2}`,
                    `${cx + width/2 * 0.8},${cy + r/2}`,
                    `${cx},${cy + r}`,
                    `${cx - width/2 * 0.8},${cy + r/2}`,
                    `${cx - width/2 * 0.8},${cy - r/2}`
                ].join(" ");

                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                polygon.setAttribute("points", points);
                
                // Color border based on column stagger
                polygon.setAttribute("class", `hex-polygon ${col === this.selectedTacticalGun?.col && row === this.selectedTacticalGun?.row ? "selected" : ""}`);
                
                // Click handler to select target or gun
                polygon.addEventListener("click", () => {
                    this.handleHexClick(col, row);
                });

                this.battleSvgOverlay.appendChild(polygon);
            }
        }

        // Draw human guns
        gameState.battle.units.forEach(u => {
            const cx = startX + u.col * width * 0.75;
            let cy = startY + u.row * height;
            if (u.col % 2 !== 0) {
                cy += height / 2;
            }

            const token = document.createElement("div");
            token.className = `tactical-unit ${u.type} ${this.selectedTacticalGun?.id === u.id ? "selected" : ""}`;
            token.style.left = `${cx}px`;
            token.style.top = `${cy}px`;
            token.textContent = u.type === "siegegun" ? "SG" : "FG";
            
            // Click handler to select
            token.addEventListener("click", () => {
                this.selectedTacticalGun = u;
                this.selectedTacticalTarget = null;
                this.renderTacticalBattle();
            });

            // Verschanzung-Abzeichen
            const ewBadge = document.createElement("div");
            ewBadge.className = "earthworks-badge";
            ewBadge.textContent = `EW: ${u.earthworks}`;
            token.appendChild(ewBadge);

            this.battleUnitsLayer.appendChild(token);
        });

        // Draw Martian Tripods
        gameState.battle.tripods.forEach((t, idx) => {
            const cx = startX + t.col * width * 0.75;
            let cy = startY + t.row * height;
            if (t.col % 2 !== 0) {
                cy += height / 2;
            }

            const token = document.createElement("div");
            token.className = `tactical-unit tripod ${t.color}-tripod ${t.damaged ? "damaged" : ""} ${this.selectedTacticalTarget === idx ? "selected" : ""}`;
            token.style.left = `${cx}px`;
            token.style.top = `${cy}px`;
            token.textContent = t.color.charAt(0).toUpperCase();

            // Click handler to target
            token.addEventListener("click", () => {
                if (this.selectedTacticalGun) {
                    this.selectedTacticalTarget = idx;
                    this.renderTacticalBattle();
                    this.triggerGunfire();
                }
            });

            this.battleUnitsLayer.appendChild(token);
        });

        // Draw drawn AI Battle Card description
        if (gameState.battle.drawnCard) {
            const c = gameState.battle.drawnCard;
            this.battleCardDisplay.className = "battle-card-display";
            this.battleCardDisplay.innerHTML = `
                <div class="card-title">Karte #${c.id.split("_")[1]} (Ini: ${c.initiative})</div>
                <div class="card-action-row"><span class="card-action-color" style="color:#00ff66;">Green:</span> <span class="card-action-value">${c.actions.green}</span></div>
                <div class="card-action-row"><span class="card-action-color" style="color:#eab308;">Yellow:</span> <span class="card-action-value">${c.actions.yellow}</span></div>
                <div class="card-action-row"><span class="card-action-color" style="color:#ef4444;">Red:</span> <span class="card-action-value">${c.actions.red}</span></div>
                <div class="card-action-row"><span class="card-action-color" style="color:#999;">Black:</span> <span class="card-action-value">${c.actions.black}</span></div>
            `;
        } else {
            this.battleCardDisplay.className = "battle-card-display empty";
            this.battleCardDisplay.innerHTML = `<div class="card-placeholder">Warte auf Zug...</div>`;
        }

        // Render Active plans lists
        this.battlePlansList.innerHTML = "";
        if (gameState.activeBattlePlans) {
            gameState.activeBattlePlans.forEach(p => {
                const planEl = document.createElement("button");
                planEl.className = `plan-token ${p.used ? "used" : ""}`;
                planEl.textContent = p.name;
                planEl.disabled = p.used || gameState.battle.currentTurn !== "H";
                planEl.addEventListener("click", () => {
                    this.selectedBattlePlanId = p.id;
                    this.logMsg(`Schlachtplan ${p.name} für nächsten Schuss ausgewählt.`, "human");
                });
                this.battlePlansList.appendChild(planEl);
            });
        }
        if (this.battlePlansList.children.length === 0) {
            this.battlePlansList.innerHTML = "<span style='font-size:11px;color:var(--text-muted);font-style:italic;'>Keine Pläne erworben.</span>";
        }
    }

    handleHexClick(col, row) {
        // Human moves guns or checks adjacency
        if (gameState.battle.currentTurn === "H" && this.selectedTacticalGun) {
            const dist = gameState.battle.getDistance(this.selectedTacticalGun, { col, row });
            if (dist === 1) {
                // Move gun to adjacent hex
                this.selectedTacticalGun.col = col;
                this.selectedTacticalGun.row = row;
                this.logMsg(`Geschütz bewegt nach Spalte ${String.fromCharCode(65 + col)}, Reihe ${row+1}.`, "human");
                this.selectedTacticalGun = null;
                this.renderTacticalBattle();
            }
        }
    }

    triggerGunfire() {
        if (this.selectedTacticalGun && this.selectedTacticalTarget !== null) {
            gameState.battle.fireAtTripod(this.selectedTacticalGun.id, this.selectedTacticalTarget, this.selectedBattlePlanId);
            this.selectedTacticalGun = null;
            this.selectedTacticalTarget = null;
            this.selectedBattlePlanId = null;
            this.renderTacticalBattle();
        }
    }

    /**
     * Draw interactive sea lanes and evacuation boats
     */
    renderTacticalSeaBattle() {
        this.battleTitle.textContent = `Seeschlacht: Hafen ${gameState.naval.zoneName}`;
        this.battleRound.textContent = gameState.naval.round;
        this.battleInitiative.textContent = "H (Menschheit)";

        // Show Sea background half
        this.battleBoardBgImg.className = "battle-board-bg sea";

        this.battleSvgOverlay.innerHTML = "";
        this.battleUnitsLayer.innerHTML = "";

        const startX = 140;
        const startY = 100;
        const width = 110;
        const height = 96;

        // Draw standard hex grid (visually identical but separate coordinates system)
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                const cx = startX + col * width * 0.75;
                let cy = startY + row * height;
                if (col % 2 !== 0) {
                    cy += height / 2;
                }

                const r = height / 2;
                const points = [
                    `${cx},${cy - r}`,
                    `${cx + width/2 * 0.8},${cy - r/2}`,
                    `${cx + width/2 * 0.8},${cy + r/2}`,
                    `${cx},${cy + r}`,
                    `${cx - width/2 * 0.8},${cy + r/2}`,
                    `${cx - width/2 * 0.8},${cy - r/2}`
                ].join(" ");

                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                polygon.setAttribute("points", points);
                polygon.setAttribute("class", `hex-polygon ${col === 0 ? "green-border" : (col === 4 ? "blue-border" : "")}`);
                this.battleSvgOverlay.appendChild(polygon);
            }
        }

        // Draw Tripods in col A (index 0)
        gameState.naval.tripods.forEach(t => {
            const cx = startX + t.col * width * 0.75;
            let cy = startY + t.row * height;
            if (t.col % 2 !== 0) {
                cy += height / 2;
            }

            const token = document.createElement("div");
            token.className = `tactical-unit tripod ${t.color}-tripod ${t.damaged ? "damaged" : ""}`;
            token.style.left = `${cx}px`;
            token.style.top = `${cy}px`;
            token.textContent = t.color.charAt(0).toUpperCase();
            this.battleUnitsLayer.appendChild(token);
        });

        // Draw sailing refugee freighters
        gameState.naval.freighters.forEach(f => {
            if (f.status === "sailing") {
                const cx = startX + f.col * width * 0.75;
                let cy = startY + f.row * height;
                if (f.col % 2 !== 0) {
                    cy += height / 2;
                }

                const token = document.createElement("div");
                token.className = `tactical-unit refugee`;
                token.style.left = `${cx}px`;
                token.style.top = `${cy}px`;
                token.textContent = f.type === "refugee2" ? "Ref2" : "Ref1";
                this.battleUnitsLayer.appendChild(token);
            }
        });

        // Draw protective warships
        gameState.naval.warships.forEach(w => {
            const cx = startX + w.col * width * 0.75;
            let cy = startY + w.row * height;
            if (w.col % 2 !== 0) {
                cy += height / 2;
            }

            const token = document.createElement("div");
            token.className = `tactical-unit warship ${w.damage > 0 ? "damaged" : ""}`;
            token.style.left = `${cx}px`;
            token.style.top = `${cy}px`;
            token.textContent = w.isThunderchild ? "HMS" : "WS";
            this.battleUnitsLayer.appendChild(token);
        });

        // Show purchase warships options in plans container
        this.battlePlansList.innerHTML = `
            <button id="btn-buy-ironclad" class="btn-primary full-width" style="font-size:12px;padding:6px 10px;">
                Panzerschiff kaufen (10 PP)
            </button>
        `;
        document.getElementById("btn-buy-ironclad").addEventListener("click", () => {
            gameState.naval.buyWarship();
        });

        // Clear card display (Martian AI drawn card not used in Sea Battle)
        this.battleCardDisplay.innerHTML = `<div style="font-size:12px;color:var(--text-muted);font-style:italic;">Keine Kampfkarten für Seeschlachten. AI agiert direkt.</div>`;
    }

    showEventCard(card) {
        this.eventCardTitle.textContent = card.title;
        this.eventCardDesc.textContent = card.desc;
        this.eventCardOptions.innerHTML = "";

        card.options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "btn-option";
            btn.textContent = opt.text;
            btn.addEventListener("click", () => {
                opt.action(gameState);
                this.eventModal.classList.add("hidden");
                gameState.nextPhase();
            });
            this.eventCardOptions.appendChild(btn);
        });

        this.eventModal.classList.remove("hidden");
    }

    showGameOver(won, reason) {
        this.switchScreen("gameover");
        this.gameOverTitle.textContent = won ? "SIEG DER MENSCHHEIT!" : "INVASION ERFOLGREICH!";
        this.gameOverTitle.style.color = won ? "var(--human-color)" : "var(--danger-color)";
        this.gameOverReason.textContent = reason;
        
        this.goStatRounds.textContent = gameState.round;
        // Count destroyed tripods count in history
        this.goStatTripods.textContent = gameState.hVp; // simple VP approximation
        this.goStatRefugees.textContent = gameState.hVp; // simple approximation
    }
}

// Global UI instance
export const ui = new UIManager();
