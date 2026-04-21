// Tutorial dialogue system

export const tutorialSteps = [
    {
        from: "game",
        text: "Hello! I'm Tesseract (unique name, I know), and I'll be your guide to 4D Snake!",
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
    /** @type {typeof tutorialSteps} */
    stepQueue = tutorialSteps;

    constructor() {
        this.active = true;
    }

    next() {
        if(this.stepQueue.length > 1) {
            this.stepQueue.shift();
        } else {
            this.active = false;
        }
    }

    drawBoxShape(ctx, boxX, boxY, pointerX, pointerY, boxWidth, boxHeight) {
        const step = this.stepQueue[0];
        const isTesseract = step.from === 'game';
        
        ctx.beginPath();
        ctx.moveTo(boxX, boxY);
        ctx.lineTo(boxX + boxWidth, boxY);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight);
        ctx.lineTo(boxX, boxY + boxHeight);
        ctx.lineTo(boxX, boxY);
        
        // Pointer triangle
        if(isTesseract) {
            ctx.moveTo(boxX + boxWidth, boxY + boxHeight / 2 + 10);
            ctx.lineTo(boxX + boxWidth + 16, pointerY);
            ctx.lineTo(boxX + boxWidth, boxY + boxHeight / 2 - 10);
        } else {
            ctx.moveTo(boxX, boxY + boxHeight / 2 + 10);
            ctx.lineTo(pointerX, pointerY);
            ctx.lineTo(boxX, boxY + boxHeight / 2 - 10);
        }
        
        ctx.closePath();
    }

    draw(ctx, tesseract) {
        if(!this.active) return;

        // If tutorial is active, fade background
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // try to do tutorial things
        const step = this.stepQueue[0];
        const isTesseract = step.from === 'game';
        
        const boxWidth = 500;
        const boxHeight = 90;
        let boxX, boxY, pointerX, pointerY;
        if(isTesseract) {
            // Box near tesseract
            boxX = tesseract.x - boxWidth - 50;
            boxY = tesseract.y;
            pointerX = tesseract.x - 25;
            pointerY = boxY + boxHeight / 2;
        } else {
            // Box near player (bottom right corner)
            boxX = 100;
            boxY = ctx.canvas.height - boxHeight - 100;
            pointerX = boxX - 16;
            pointerY = boxY + boxHeight / 2;
        }
        
        ctx.strokeStyle = isTesseract ? '#00e6ff' : '#61618d';
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        this.drawBoxShape(ctx, boxX, boxY, pointerX, pointerY, boxWidth, boxHeight);
        ctx.stroke();

        ctx.fillStyle = isTesseract ? '#222' : '#2a2a44';
        this.drawBoxShape(ctx, boxX, boxY, pointerX, pointerY, boxWidth, boxHeight);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textBaseline = 'top';

        // Text wrap
        const text = step.text;
        const words = text.split(' ');
        let line = '', y = boxY + 16;
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const measure = ctx.measureText(testLine);
            if(measure.width > boxWidth - 24 && n > 0) {
                ctx.fillText(line, boxX + 12, y);
                line = words[n] + ' ';
                y += 22;
            } else {
                line = testLine;
            }
        }

        ctx.fillText(line, boxX + 12, y);
        ctx.restore();
    }
}
