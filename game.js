import { Vector4 } from "./vector4.js";
import { Tutorial } from "./tutorial.js";
import { Tesseract } from "./tesseract.js";
import { Particles } from "./particles.js";
import { clamp, lerpColor } from "./math.js";
import { BOARD_SIZE, calculateLayout, getPlaneRect, getCellRect } from "./layout.js";

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

const Palette = {
    BackgroundTop: '#0b1020',
    BackgroundBottom: '#11172b',
    BoardCard: '#1a2438',
    BoardStroke: 'rgba(255, 255, 255, 0.08)',
    EmptyCellA: '#141f33',
    EmptyCellB: '#16253a',
    GridLine: 'rgba(255, 255, 255, 0.05)',
    SnakeHead: '#7ff5a1',
    SnakeBodyStart: '#5ae083',
    SnakeBodyEnd: '#28a45a',
    Food: '#ff6b6b'
};

const BoardState = {
    Empty: 0,
    Snake: 1,
    Food: 2
};

/** @type {number[][][][]} */
let board = [];
let currentLayout = null;
let score = 0;
let gameOver = false;
let lastRenderTime = performance.now();

function drawRect(ctx, x, y, width, height, radius) {
    // For now, just normal rect?
    ctx.fillRect(x, y, width, height);
}

function initBoard() {
    for(let w = 0; w < BOARD_SIZE; w++) {
        board[w] = [];
        for(let z = 0; z < BOARD_SIZE; z++) {
            board[w][z] = [];
            for(let y = 0; y < BOARD_SIZE; y++) {
                board[w][z][y] = [];
                for(let x = 0; x < BOARD_SIZE; x++) {
                    board[w][z][y][x] = 0;
                }
            }
        }
    }
}

initBoard();

class Snake {
    constructor() {
        this.direction = new Vector4(1, 0, 0, 0); // Initial direction: +X
        this.nextDirection = this.direction;
        this.body = [new Vector4(1, 1, 1, 1)]; // Initial position: (1, 1, 1, 1)
        this.alive = true;
    }

    setDirection(direction) {
        if(!this.alive) return;

        const opposite =
            this.direction.x + direction.x === 0 &&
            this.direction.y + direction.y === 0 &&
            this.direction.z + direction.z === 0 &&
            this.direction.w + direction.w === 0;

        if(!opposite || this.body.length === 1) {
            this.nextDirection = direction;
        }
    }

    updateBoard() {
        // Clear previous snake position
        for(let w = 0; w < BOARD_SIZE; w++) {
            for(let z = 0; z < BOARD_SIZE; z++) {
                for(let y = 0; y < BOARD_SIZE; y++) {
                    for(let x = 0; x < BOARD_SIZE; x++) {
                        if(board[w][z][y][x] === BoardState.Snake) {
                            board[w][z][y][x] = BoardState.Empty;
                        }
                    }
                }
            }
        }

        // Set new snake position
        for(const segment of this.body) {
            board[segment.w][segment.z][segment.y][segment.x] = BoardState.Snake;
        }
    }

    move() {
        if(!this.alive || gameOver || tutorial.active) return;

        this.direction = this.nextDirection;
        const newHead = this.body[0].add(this.direction);
        // Wrap
        newHead.x = (newHead.x + BOARD_SIZE) % BOARD_SIZE;
        newHead.y = (newHead.y + BOARD_SIZE) % BOARD_SIZE;
        newHead.z = (newHead.z + BOARD_SIZE) % BOARD_SIZE;
        newHead.w = (newHead.w + BOARD_SIZE) % BOARD_SIZE;

        // Check for self-collision
        if(board[newHead.w][newHead.z][newHead.y][newHead.x] === BoardState.Snake) {
            this.alive = false;
            gameOver = true;
            return;
        }

        // Check for food
        const grow = board[newHead.w][newHead.z][newHead.y][newHead.x] === BoardState.Food;

        this.body.unshift(newHead); // Add new head
        if(!grow) this.body.pop(); // Remove tail

        this.updateBoard();

        if(grow) {
            score += 1;
            placeFood();
        }
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let snake = new Snake();
snake.updateBoard();

const tesseract = new Tesseract();
const tutorial = new Tutorial();
const particles = new Particles();

setInterval(() => {
    snake.move();
}, 500);

function placeFood() {
    let emptyCells = [];
    for(let w = 0; w < BOARD_SIZE; w++) {
        for(let z = 0; z < BOARD_SIZE; z++) {
            for(let y = 0; y < BOARD_SIZE; y++) {
                for(let x = 0; x < BOARD_SIZE; x++) {
                    if(board[w][z][y][x] === BoardState.Empty) {
                        emptyCells.push(new Vector4(x, y, z, w));
                    }
                }
            }
        }
    }

    if(emptyCells.length > 0) {
        const foodPos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[foodPos.w][foodPos.z][foodPos.y][foodPos.x] = BoardState.Food;
    }
}

placeFood();

function drawBoard(layout) {
    for(let w = 0; w < BOARD_SIZE; w++) {
        for(let z = 0; z < BOARD_SIZE; z++) {
            const plane = getPlaneRect(layout, w, z);

            ctx.fillStyle = Palette.BoardCard;
            drawRect(ctx, plane.x, plane.y, plane.width, plane.height, layout.planeSize * 0.06);
            ctx.fill();

            ctx.strokeStyle = Palette.BoardStroke;
            ctx.lineWidth = 1.2;
            drawRect(ctx, plane.x, plane.y, plane.width, plane.height, layout.planeSize * 0.06);
            ctx.stroke();

            for(let y = 0; y < BOARD_SIZE; y++) {
                for(let x = 0; x < BOARD_SIZE; x++) {
                    const rect = getCellRect(layout, new Vector4(x, y, z, w));
                    ctx.fillStyle = (x + y) % 2 === 0 ? Palette.EmptyCellA : Palette.EmptyCellB;
                    drawRect(ctx, rect.x, rect.y, rect.width, rect.height, rect.width * 0.18);
                    ctx.fill();

                    if(board[w][z][y][x] === BoardState.Food) {
                        ctx.fillStyle = Palette.Food;
                        drawRect(ctx, rect.x + rect.width * 0.15, rect.y + rect.height * 0.15, rect.width * 0.7, rect.height * 0.7, rect.width * 0.35);
                        ctx.fill();
                    }
                }
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.font = `10px sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(`W${w}Z${z}`, plane.x + 5, plane.y + 5);
        }
    }
}

function drawSnake(layout) {
    const segmentCount = snake.body.length;
    for(let i = segmentCount - 1; i >= 0; i--) {
        const segment = snake.body[i];
        const rect = getCellRect(layout, segment);
        const t = segmentCount <= 1 ? 0 : i / (segmentCount - 1);
        const color = i === 0
            ? Palette.SnakeHead
            : lerpColor(Palette.SnakeBodyStart, Palette.SnakeBodyEnd, t);

        ctx.fillStyle = color;
        drawRect(ctx, rect.x, rect.y, rect.width, rect.height, rect.width * 0.22);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1;
        drawRect(ctx, rect.x, rect.y, rect.width, rect.height, rect.width * 0.22);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        drawRect(
            ctx,
            rect.x + rect.width * 0.11,
            rect.y + rect.height * 0.12,
            rect.width * 0.58,
            rect.height * 0.26,
            rect.width * 0.12
        );
        ctx.fill();
    }

    const headRect = getCellRect(layout, snake.body[0]);
    const eyeOffsetX = snake.direction.x !== 0 ? snake.direction.x * headRect.width * 0.2 : 0;
    const eyeOffsetY = snake.direction.y !== 0 ? snake.direction.y * headRect.height * 0.2 : 0;
    const eyeYBase = headRect.y + headRect.height * 0.37 + eyeOffsetY;
    const eyeRadius = Math.max(1.5, headRect.width * 0.07);
    ctx.fillStyle = '#16311f';
    ctx.beginPath();
    ctx.arc(headRect.x + headRect.width * 0.36 + eyeOffsetX, eyeYBase, eyeRadius, 0, Math.PI * 2);
    ctx.arc(headRect.x + headRect.width * 0.64 + eyeOffsetX, eyeYBase, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
}

function render(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const deltaTime = clamp((now - lastRenderTime) / 1000, 0, 0.04);
    lastRenderTime = now;
    particles.update(deltaTime);

    currentLayout = calculateLayout();
    drawBoard(currentLayout);
    drawSnake(currentLayout);
    particles.draw(ctx);

    tutorial.draw(ctx, tesseract);
    tesseract.draw(ctx);

    requestAnimationFrame(render);
}

render(performance.now());

// Controls
document.addEventListener('keydown', (e) => {
    if(tutorial.active) {
        tutorial.next();
        return;
    }

    // We have more directions to move in than normal snake, but thankfully
    // both WASD and IJKL are pretty standard and make it intuitive enough
    switch(e.key) {
        case 'w': snake.setDirection(new Vector4(0, -1, 0, 0)); break; // Up
        case 's': snake.setDirection(new Vector4(0, 1, 0, 0)); break; // Down
        case 'a': snake.setDirection(new Vector4(-1, 0, 0, 0)); break; // Left
        case 'd': snake.setDirection(new Vector4(1, 0, 0, 0)); break; // Right
        case 'i': snake.setDirection(new Vector4(0, 0, -1, 0)); break; // Forward (Z-)
        case 'k': snake.setDirection(new Vector4(0, 0, 1, 0)); break; // Backward (Z+)
        case 'j': snake.setDirection(new Vector4(0, 0, 0, -1)); break; // W-
        case 'l': snake.setDirection(new Vector4(0, 0, 0, 1)); break; // W+
    }
});