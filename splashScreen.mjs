import ANSI from "./utils/ANSI.mjs";


const outputGraphics = `
 ██▓    ▄▄▄       ▄▄▄▄ ▓██   ██▓ ██▀███   ██▓ ███▄    █ ▄▄▄█████▓ ██░ ██
▓██▒   ▒████▄    ▓█████▄▒██  ██▒▓██ ▒ ██▒▓██▒ ██ ▀█   █ ▓  ██▒ ▓▒▓██░ ██▒
▒██░   ▒██  ▀█▄  ▒██▒ ▄██▒██ ██░▓██ ░▄█ ▒▒██▒▓██  ▀█ ██▒▒ ▓██░ ▒░▒██▀▀██░
▒██░   ░██▄▄▄▄██ ▒██░█▀  ░ ▐██▓░▒██▀▀█▄  ░██░▓██▒  ▐▌██▒░ ▓██▓ ░ ░▓█ ░██
░██████▒▓█   ▓██▒░▓█  ▀█▓░ ██▒▓░░██▓ ▒██▒░██░▒██░   ▓██░  ▒██▒ ░ ░▓█▒░██▓
░ ▒░▓  ░▒▒   ▓▒█░░▒▓███▀▒ ██▒▒▒ ░ ▒▓ ░▒▓░░▓  ░ ▒░   ▒ ▒   ▒ ░░    ▒ ░░▒░▒
░ ░ ▒  ░ ▒   ▒▒ ░▒░▒   ░▓██ ░▒░   ░▒ ░ ▒░ ▒ ░░ ░░   ░ ▒░    ░     ▒ ░▒░ ░
  ░ ░    ░   ▒    ░    ░▒ ▒ ░░    ░░   ░  ▒ ░   ░   ░ ░   ░       ░  ░░ ░
    ░  ░     ░  ░ ░     ░ ░        ░      ░           ░           ░  ░  ░
                       ░░ ░
`;



class SplashScreen {
    constructor(onComplete) {
        this.opacity = 1; // Start fully visible
        this.fadeDirection = -1; // Start fading out
        this.onComplete = onComplete; // Callback when done
        this.dirty = true;
        this.completed = false;
    }

    update() {
        if (this.completed) return;

        // Update opacity
        this.opacity += this.fadeDirection * 0.02;

        // Check for completion
        if (this.opacity <= 0) {
            this.fadeDirection = 0; // Stop fading
            this.completed = true; // Mark as completed
            if (this.onComplete) {
                this.onComplete(); // Notify the game that the splash is done
            }
        }

        // Mark as dirty for redrawing
        this.dirty = true;
    }

    draw() {
        if (!this.dirty) return;
        this.dirty = false;

        // Clear and redraw the screen
        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        const fadedGraphics = this.applyFadeEffect(outputGraphics, this.opacity);
        console.log(fadedGraphics);
    }

    applyFadeEffect(graphics, opacity) {
        // Map opacity (0-1) to grayscale (bright white to black)
        const brightness = Math.round(opacity * 255);
        const ansiColor = `\x1b[38;2;${brightness};${brightness};${brightness}m`;
        const resetColor = ANSI.RESET;

        return graphics
            .split("\n")
            .map(line => ansiColor + line + resetColor)
            .join("\n");
    }
}

export default SplashScreen;