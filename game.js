import { Vector4 } from "./vector4.js";
import { Tutorial } from "./tutorial.js";
import { Tesseract } from "./tesseract.js";

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

const BOARD_SIZE = 4;
const BOARD_PADDING = 0.1;
const CANVAS_PADDING = 20;

const BoardState = {
    EMPTY: 0,
    SNAKE: 1,
    FOOD: 2
};
const BoardStateColors = {
    [BoardState.EMPTY]: '#222222',
    [BoardState.SNAKE]: '#33cc33',
    [BoardState.FOOD]: '#cc3333'
};

/** @type {number[][][][]} */
let board = [];

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
        this.body = [new Vector4(1, 1, 1, 1)]; // Initial position: (1, 1, 1, 1)
    }

    updateBoard() {
        // Clear previous snake position
        for(let w = 0; w < BOARD_SIZE; w++) {
            for(let z = 0; z < BOARD_SIZE; z++) {
                for(let y = 0; y < BOARD_SIZE; y++) {
                    for(let x = 0; x < BOARD_SIZE; x++) {
                        if(board[w][z][y][x] === BoardState.SNAKE) {
                            board[w][z][y][x] = BoardState.EMPTY;
                        }
                    }
                }
            }
        }

        // Set new snake position
        for(const segment of this.body) {
            board[segment.w][segment.z][segment.y][segment.x] = BoardState.SNAKE;
        }
    }

    move() {
        const newHead = this.body[0].add(this.direction);
        // Wrap
        newHead.x = (newHead.x + BOARD_SIZE) % BOARD_SIZE;
        newHead.y = (newHead.y + BOARD_SIZE) % BOARD_SIZE;
        newHead.z = (newHead.z + BOARD_SIZE) % BOARD_SIZE;
        newHead.w = (newHead.w + BOARD_SIZE) % BOARD_SIZE;

        // Check for self-collision
        if(board[newHead.w][newHead.z][newHead.y][newHead.x] === BoardState.SNAKE) {
            alert('Game Over!');
            // TODO
            return;
        }

        // Check for food
        let grow = board[newHead.w][newHead.z][newHead.y][newHead.x] === BoardState.FOOD;

        this.body.unshift(newHead); // Add new head
        if(!grow) this.body.pop(); // Remove tail

        this.updateBoard();

        if(grow) placeFood();
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

let speed = 500; // ms per move
setInterval(() => {
    snake.move();
}, speed);

function placeFood() {
    let emptyCells = [];
    for(let w = 0; w < BOARD_SIZE; w++) {
        for(let z = 0; z < BOARD_SIZE; z++) {
            for(let y = 0; y < BOARD_SIZE; y++) {
                for(let x = 0; x < BOARD_SIZE; x++) {
                    if(board[w][z][y][x] === BoardState.EMPTY) {
                        emptyCells.push(new Vector4(x, y, z, w));
                    }
                }
            }
        }
    }

    if(emptyCells.length > 0) {
        const foodPos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[foodPos.w][foodPos.z][foodPos.y][foodPos.x] = BoardState.FOOD;
    }
}

placeFood();

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw BOARD_SIZE x BOARD_SIZE grids, each representing a different XY plane at Z and W
    const cellSize =
        (Math.min(canvas.width, canvas.height) - CANVAS_PADDING * 2) /
        ((BOARD_SIZE + BOARD_PADDING * (BOARD_SIZE - 1)) * BOARD_SIZE);
    const gridSize = cellSize * BOARD_SIZE;

    for(let w = 0; w < BOARD_SIZE; w++) {
        for(let z = 0; z < BOARD_SIZE; z++) {
            const offsetX = (gridSize + BOARD_PADDING * gridSize) * w + CANVAS_PADDING;
            const offsetY = (gridSize + BOARD_PADDING * gridSize) * z + CANVAS_PADDING;

            // Draw grid background
            ctx.fillStyle = BoardStateColors[BoardState.EMPTY];
            ctx.fillRect(offsetX, offsetY, gridSize, gridSize);

            // Draw cells
            for(let y = 0; y < BOARD_SIZE; y++) {
                for(let x = 0; x < BOARD_SIZE; x++) {
                    const state = board[w][z][y][x];
                    if(state !== BoardState.EMPTY) {
                        ctx.fillStyle = BoardStateColors[state];
                        ctx.fillRect(
                            offsetX + x * cellSize,
                            offsetY + y * cellSize,
                            cellSize,
                            cellSize
                        );
                    }
                }
            }

            // Draw grid lines
            ctx.strokeStyle = '#555';
            for(let i = 0; i <= BOARD_SIZE; i++) {
                const pos = i * cellSize;
                ctx.beginPath();
                ctx.moveTo(offsetX + pos, offsetY);
                ctx.lineTo(offsetX + pos, offsetY + gridSize);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(offsetX, offsetY + pos);
                ctx.lineTo(offsetX + gridSize, offsetY + pos);
                ctx.stroke();
            }
        }
    }

    tutorial.draw(ctx, tesseract);
    tesseract.draw(ctx);

    requestAnimationFrame(render);
}

render();

// Controls
document.addEventListener('keydown', (e) => {
    if (tutorial.active) {
        tutorial.next();
        return;
    }

    // We have more directions to move in than normal snake, but thankfully
    // both WASD and IJKL are pretty standard and make it intuitive enough
    switch(e.key) {
        case 'w': snake.direction = new Vector4(0, -1, 0, 0); break; // Up
        case 's': snake.direction = new Vector4(0, 1, 0, 0); break; // Down
        case 'a': snake.direction = new Vector4(-1, 0, 0, 0); break; // Left
        case 'd': snake.direction = new Vector4(1, 0, 0, 0); break; // Right
        case 'i': snake.direction = new Vector4(0, 0, -1, 0); break; // Forward (Z-)
        case 'k': snake.direction = new Vector4(0, 0, 1, 0); break; // Backward (Z+)
        case 'j': snake.direction = new Vector4(0, 0, 0, -1); break; // W- (W-)
        case 'l': snake.direction = new Vector4(0, 0, 0, 1); break; // W+ (W+)
    }
});