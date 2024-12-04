import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";
import SplashScreen from "./splashScreen.mjs";

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

const splashScreen = new SplashScreen(() => {
    clearInterval(interval); // Stop the splash screen loop
    console.log(ANSI.CLEAR_SCREEN, "Splash screen finished. Starting game...");
});

let interval = setInterval(() => {
    splashScreen.update();
    splashScreen.draw();
}, 1000 / 60); // 60 FPS
//tried both hardcoding and making a doorMappings constant to move back and forth between levels, but couldn't get it to work

//const doorMappings = {
//    "startingLevel": {
//        "3,29": { level: "aSharpPlace", row: 3, col: 2 },
//    },
//    "aSharpPlace": {
//        "3,1": { level: "startingLevel", row: 3, col: 28 },
//        "16,17": { level: "bossRoom", row: 3, col: 2 },
//    },
//    "bossRoom": {
//        "15,17": { level: "aSharpPlace", row: 3, col: 1 },
//    },
//};


const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

function findTeleportLocations(level) {
    let locations = [];
    for (let row = 0; row < level.length; row++) {
        for (let col = 0; col < level[row].length; col++) {
            if (level[row][col] === TELEPORT) {
                locations.push({ row, col });
            }
        }
    }
    return locations;
}

let currentLevel = startingLevel;
let levelData = readMapFile(levels[startingLevel]);
let level = levelData;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
    "D": ANSI.COLOR.BLUE,
    "♨": ANSI.COLOR.BLUE,
}


let isDirty = true;

let playerPos = {
    row: null,
    col: null,
}

const EMPTY = " ";
const HERO = "H";
const LOOT = "$"
const DOOR = "D"
const TELEPORT ="♨"
const ENEMY ="X"

let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY, DOOR, TELEPORT];

let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    chash: 0
}

let enemies = findEnemies(level);

function findEnemies(level) {
    let enemies = [];
    for (let row = 0; row < level.length; row++) {
        for (let col = 0; col < level[row].length; col++) {
            if (level[row][col] === ENEMY) {
                enemies.push({ row, col, startRow: row, startCol: col });
            }
        }
    }
    return enemies;
}

function patrolEnemy(enemy) {
    const directions = [
        { dRow: 0, dCol: 1 },  // Right
        { dRow: 0, dCol: -1 }, // Left
        { dRow: 1, dCol: 0 },  // Down
        { dRow: -1, dCol: 0 }  // Up
    ];

    // Randomly select a direction for movement
    const direction = directions[Math.floor(Math.random() * directions.length)];

    const newRow = enemy.row + direction.dRow;
    const newCol = enemy.col + direction.dCol;

    // Check if the new position is within patrol range and empty
    if (
        newRow >= enemy.startRow - 2 &&
        newRow <= enemy.startRow + 2 &&
        newCol >= enemy.startCol - 2 &&
        newCol <= enemy.startCol + 2 &&
        level[newRow]?.[newCol] === EMPTY
    ) {
        // Move the enemy
        level[enemy.row][enemy.col] = EMPTY; // Clear old position
        level[newRow][newCol] = ENEMY; // Set new position
        enemy.row = newRow;
        enemy.col = newCol;
    }
}

class Labyrinth {
    loadLevel(levelName, startRow = 0, startCol = 0) {
        // Check if the level exists in the levels list
        if (!levels[levelName]) {
            console.error(`Level ${levelName} does not exist!`);
            return;
        }

        // Load the new level data from the levels object (this is where the map data is loaded)
        levelData = readMapFile(levels[levelName]);
        level = levelData;  // Update the current level map with the new level's map

        // Update the current level to the new level
        currentLevel = levelName;

        // Set the player's position based on provided startRow and startCol
        playerPos.row = startRow;
        playerPos.col = startCol;

        // Mark the screen for redraw after loading the level
        isDirty = true;
        eventText = `Entering ${levelName}`;

        // Re-render the game after loading the new level
        this.draw();
    }
    
    update() {
        if (playerPos.row == null) {
            // Locate the player's starting position
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == HERO) {
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row != undefined) {
                    break;
                }
            }
        }
    
        let drow = 0;
        let dcol = 0;
    
        // Detect player movement
        if (KeyBoardManager.isUpPressed()) drow = -1;
        else if (KeyBoardManager.isDownPressed()) drow = 1;
    
        if (KeyBoardManager.isLeftPressed()) dcol = -1;
        else if (KeyBoardManager.isRightPressed()) dcol = 1;
    
        let tRow = playerPos.row + drow;
        let tCol = playerPos.col + dcol;
    
        // Ensure the coordinates are within the bounds of the level
        if (tRow >= 0 && tRow < level.length && tCol >= 0 && tCol < level[tRow].length) {
            let currentItem = level[tRow][tCol];
    
            if (THINGS.includes(currentItem)) {
                if (currentItem == LOOT) {
                    let loot = Math.round(Math.random() * 7) + 3;
                    playerStats.chash += loot;
                    eventText = `Player gained ${loot}$`;
                } if (currentItem == DOOR) {
                    if (currentItem == DOOR) {
                        // Hardcoded door transitions
                        if (currentLevel === startingLevel && tRow === 3 && tCol === 29) {
                            this.loadLevel("aSharpPlace", 3, 2); // Transition to aSharpPlace
                        } else if (currentLevel === "aSharpPlace" && tRow === 3 && tCol === 1) {
                            this.loadLevel(startingLevel, 3, 28); // Transition back to startingLevel
                        } else if (currentLevel === "aSharpPlace" && tRow === 16 && tCol === 17) {
                            this.loadLevel("bossRoom", 3, 2); // Transition to bossRoom
                        } else if (currentLevel === "bossRoom" && tRow === 15 && tCol === 17) {
                            this.loadLevel("aSharpPlace", 3, 1); // Transition back to aSharpPlace
                        } else {
                            eventText = `This door seems broken at ${tRow},${tCol} in ${currentLevel}`;
                        }
                        return;
                    }
                    
                } else if (currentItem == TELEPORT) {
                    this.teleportPlayer(tRow, tCol); // Call for teleportation
                    return;
                }
    
                // Move the HERO
                level[playerPos.row][playerPos.col] = EMPTY;
                level[tRow][tCol] = HERO;
    
                // Update the HERO's position
                playerPos.row = tRow;
                playerPos.col = tCol;
    
                isDirty = true;
            } else {
                direction *= -1;
            }
        } else {
            eventText = "Invalid move: Out of bounds";
        }
    }

            // Patrol enemies
            //for (let enemy of enemies) {
            //    patrolEnemy(enemy);
            //}
    
            //isDirty = true;
        //}

    draw() {

        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendring = "";

        rendring += renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol] != undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendring += rowRendering;
        }

        console.log(rendring);
        if (eventText != "") {
            console.log(eventText);
            eventText = "";
        }
    }

    teleportPlayer(currentRow, currentCol) {
        // Find all teleport locations
        let teleportLocations = findTeleportLocations(level);
    
        if (teleportLocations.length !== 2) {
            eventText = "Teleportation error: Map should have exactly 2 teleport symbols!";
            return;
        }
    
        // Find the other teleport location
        let destination = teleportLocations.find(
            loc => loc.row !== currentRow || loc.col !== currentCol
        );
        if (!destination) {
            eventText = "Could not find the other teleporter!";
            return;
        }
    
        // Clear the player's current position (set to EMPTY)
        level[playerPos.row][playerPos.col] = EMPTY;
    
        // Calculate the new position: one tile to the right of the destination teleporter
        let newRow = destination.row;
        let newCol = destination.col + 1;
    
        // Check if the destination is valid (not a wall or occupied tile)
        if (level[newRow][newCol] === "█") {
            eventText = "Can't teleport: Space to the right is blocked!";
            return;
        }
    
        // Update the HERO's position
        playerPos.row = newRow;
        playerPos.col = newCol;
    
        // Place the HERO at the new position
        level[playerPos.row][playerPos.col] = HERO;
    
        // Mark the screen for redraw
        isDirty = true;
        eventText = "Whoosh! Teleported!";
    }
    
    loadNextLevel() {
        if (levels[aSharpPlace]) {
            levelData = readMapFile(levels[aSharpPlace]); // Load the new level data
            level = levelData;
            playerPos.row = null; // Reset the player's position
            isDirty = true; // Mark the screen as needing to be redrawn
            eventText = `You have entered a new place: ${levels[aSharpPlace]}!`;
        } else {
            eventText = "No more levels to load!";
            console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME, "GAME OVER");
            process.exit(); // End the game
        }
    }
    
    
}

function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`
    let cash = `$:${playerStats.chash}`;
    return `${hpBar} ${cash}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}


export default Labyrinth;