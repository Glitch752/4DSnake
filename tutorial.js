// Tutorial dialogue system

export const tutorialSteps = [
    {
        from: "game",
        text: "Hello! I'm Tesseract (I guess?), and I'll be your guide to 4D Snake!",
    },
    {
        from: "player",
        text: "Okay... but where am I?"
    },
    {
        from: "game",
        text: "You're in the 4D world! It's like our 3D world but with an extra dimension called W. You can think of it as a direction perpendicular to all the others.",
    },
    {
        from: "player",
        text: "No, I meant... how did I get here? What's going on?"
    },
    {
        from: "game",
        text: "Oh, right. You're a snake! A 4D snake! You need to eat food to grow longer, but be careful not to run into yourself!",
    },
    {
        from: "player",
        text: "No, I get that but... AAH! I can't feel my body!"
    },
    {
        from: "game",
        text: "Silly player... don't worry about it!"
    },
    {
        from: "game",
        text: "You can use WASD to move in X/Y, and IJKL for Z/W. Try moving in all directions!"
    },
    {
        from: "game",
        text: "Normal snake has a single grid where the vertical and horizontal axes represent X and Y..."
    },
    {
        from: "game",
        text: "But in 4D snake, we have a grid of these grids! Each grid is a \"slice\" of the 4D space!"
    },
    {
        from: "player",
        text: "So how do I get out?"
    },
    {
        from: "game",
        text: "You win!"
    },
    {
        from: "player",
        text: "I... win? How!?"
    },
    {
        from: "game",
        text: "You'll have to figure that one out yourself. Good luck!"
    }
];

export class Tutorial {
    constructor() {
        this.currentStep = 0;
        this.active = true;
    }

    next() {
        if (this.currentStep < tutorialSteps.length - 1) {
            this.currentStep++;
        } else {
            this.active = false;
        }
    }

    draw(ctx, tesseract) {
        if (!this.active) return;
        // try to do tutorial things
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#00e6ff';
        ctx.lineWidth = 2;
        const boxX = tesseract.x + tesseract.size + 10;
        const boxY = tesseract.y;
        const boxW = 320;
        const boxH = 60;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.fillText(tutorialSteps[this.currentStep].text, boxX + 12, boxY + 32);
        ctx.restore();
    }
}
