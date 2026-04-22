import { ease } from "./math.js";
import { Palette } from "./rendering.js";

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
    },
    {
        from: "game",
        text: "Oh, and on a more serious note... you may want to play at least a few times and watch out :)"
    }
];

export const firstDeathSteps = [
    {
        from: "game",
        text: "Harder than it looks, huh?"
    },
    {
        from: "game",
        text: "Well, I'm sure you've got it in you."
    }
];

export const fastDeathSteps = [
    {
        from: "game",
        text: "You're starting to see it now, huh?"
    },
    {
        from: "game",
        text: "You can never beat this."
    },
    {
        from: "player",
        text: "Wait, what? Why not?"
    },
    {
        from: "game",
        text: "It's too fast. You're no supercomputer. Face it - you're no match for 4D."
    },
    {
        from: "player",
        text: "What am I supposed to do, then?!"
    },
    {
        from: "game",
        text: "Let's see... if only there was some way to... look through time?"
    },
    {
        from: "player",
        text: "What do you mean, look through time?"
    },
    {
        from: "game",
        text: "Well, in your measly 3D existence, the fourth dimension is often considered time, isn't it?"
    },
    {
        from: "player",
        text: "Yeah, but... I don't see how that helps me."
    },
    {
        from: "game",
        text: "What if I told you... that there's a way? That you could use your scrollbar?"
    },
    {
        from: "game",
        text: "Anyways, I have to go. Good luck!"
    }
];
export const winSteps = [
    {
        from: "game",
        text: "You know what... I'm impressed. You've clearly got it from here."
    },
    {
        from: "game",
        text: "Consider this a win. I'll let you keep going since you're clearly enjoying your time as a snake."
    },
    {
        from: "player",
        text: "Wait-!"
    },
    {
        from: "game",
        text: "See you around, snake!"
    }
]

export class Dialogue {
    /** @type {typeof tutorialSteps} */
    stepQueue = tutorialSteps;

    onFinishCallbacks = [];

    constructor() {
        this.active = true;
    }

    next() {
        this.stepQueue.shift();
        if(this.stepQueue.length <= 0) {
            this.active = false;
            this.onFinishCallbacks.forEach(callback => callback());
            this.onFinishCallbacks = [];
        }
    }

    queue(steps = []) {
        this.stepQueue.push(...steps);
        this.active = true;
    }

    onFinish(callback) {
        this.onFinishCallbacks.push(callback);
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
    
    animation = {
        startTime: null,
        lastStepRef: null,
        revealIndex: 0,
        lastRevealTime: 0
    };
    
    draw(ctx, tesseract) {
        if(!this.active) return;

        const revealSpeed = 15; // ms per character

        // Initialize timing on first draw
        if(!this.animation.startTime) this.animation.startTime = performance.now();

        const step = this.stepQueue[0];
        if(!step) return;

        // when step changes, reset animation
        if(this.animation.lastStepRef !== step) {
            this.animation.lastStepRef = step;
            this.animation.revealIndex = 0;
            this.animation.lastRevealTime = performance.now();
            this.animation.startTime = performance.now();
        }

        // Advance reveal based on time
        const now = performance.now();
        const elapsed = now - this.animation.lastRevealTime;
        if(this.animation.revealIndex < step.text.length) {
            const advance = Math.floor(elapsed / revealSpeed);
            if(advance > 0) {
                this.animation.revealIndex = Math.min(step.text.length, this.animation.revealIndex + advance);
                this.animation.lastRevealTime += advance * revealSpeed;
            }
        }
        if(this.animation.revealIndex >= step.text.length) {
            this.animation.lastRevealTime = now;
        }

        const isTesseract = step.from === 'game';

        // If dialogue is active, fade background
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
            boxX = 60;
            boxY = ctx.canvas.height - boxHeight - 60;
            pointerX = boxX - 16;
            pointerY = boxY + boxHeight / 2;
        }

        const animElapsed = now - this.animation.startTime;
        ctx.globalAlpha = animElapsed < 250 ? animElapsed / 250 : 1; // fade in
        ctx.translate(0, animElapsed < 250 ? ease(1 - animElapsed / 250) * -10 : 0);

        ctx.strokeStyle = isTesseract ? Palette.Tesseract : Palette.Player;
        ctx.lineWidth = 4;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        this.drawBoxShape(ctx, boxX, boxY, pointerX, pointerY, boxWidth, boxHeight);
        ctx.stroke();

        ctx.fillStyle = Palette.BoardBg;
        this.drawBoxShape(ctx, boxX, boxY, pointerX, pointerY, boxWidth, boxHeight);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textBaseline = 'top';

        const fullText = step.text;
        const visibleText = fullText.slice(0, this.animation.revealIndex);

        // blinking caret if not fully revealed
        let displayText = visibleText;
        if(this.animation.revealIndex < fullText.length) {
            const blinkOn = Math.floor(now / 500) % 2 === 0;
            displayText = visibleText + (blinkOn ? '|' : '');
        }

        // Text wrap
        const words = displayText.split(' ');
        let line = '', y = boxY + 16;
        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + (n === words.length - 1 ? '' : ' ');
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
