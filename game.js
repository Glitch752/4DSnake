import { Vector4 } from "./vector4.js";
import { Dialogue } from "./dialogue.js";
import { Tesseract } from "./tesseract.js";
import { Particles } from "./particles.js";
import { BOARD_SIZE } from "./layout.js";
import { Snake } from "./snake.js";
import { emitResetParticles, render } from "./rendering.js";
import { playSound } from "./sounds.js";

// an ""enum""
export const BoardState = {
    Empty: 0,
    Snake: 1,
    Food: 2
};

// an ""enum"" again
export const GameStage = {
    Start: 'start',
    FailedOnce: 'failedOnce',
    FiveD: '5d'
};

export class BoardSnapshot {
    /** @type {BoardState[keyof BoardState][][][][]} */
    board = [];
    score = 0;
    gameOver = false;
    /** Multiplier of base speed */
    speed = 1;
    /** @type {Snake} */
    snake;

    /** @type {HTMLDivElement} */
    container;
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {HTMLSpanElement} */
    header;
    /** @type {CanvasRenderingContext2D} */
    ctx;
    poolIndex = 0;

    creationTimestamp = 0;

    constructor() {
        // fixed-size canvas pool instead of creating new canvases
        const poolIndex = BoardSnapshot.openPoolIndices.values().next().value;
        if(poolIndex === undefined) {
            throw new Error("No more canvases available in the pool!");
        }
        BoardSnapshot.openPoolIndices.delete(poolIndex);
        this.poolIndex = poolIndex;

        const item = BoardSnapshot.canvasPool[poolIndex];
        this.container = item[0];
        this.canvas = this.container.querySelector('canvas');
        this.header = this.container.querySelector('span');
        this.ctx = item[1];
        this.container.style.display = "block"; // In case it was hidden by remove()

        this.creationTimestamp = game.timestamp;
    }

    initBoard() {
        for(let w = 0; w < BOARD_SIZE; w++) {
            this.board[w] = [];
            for(let z = 0; z < BOARD_SIZE; z++) {
                this.board[w][z] = [];
                for(let y = 0; y < BOARD_SIZE; y++) {
                    this.board[w][z][y] = [];
                    for(let x = 0; x < BOARD_SIZE; x++) {
                        this.board[w][z][y][x] = 0;
                    }
                }
            }
        }
    }

    clone() {
        const ss = new BoardSnapshot();
        ss.board = structuredClone(this.board);
        ss.score = this.score;
        ss.gameOver = this.gameOver;
        ss.speed = this.speed;
        ss.snake = this.snake.clone();
        return ss;
    }

    /** Advance this board and get the new board. */
    advance() {
        const ss = this.clone();
        const grew = ss.snake.move(ss);
        ss.snake.updateBoard(ss.board);

        if(grew) {
            ss.placeFood();
            ss.speed *= 1.02;
        }
        if(!ss.snake.alive) {
            ss.gameOver = true;
        }
        ss.score += ss.snake.body.length - game.board.snake.body.length;
        return ss;
    }

    remove() {
        // Will be reused anyway
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.container.style.display = "none";

        BoardSnapshot.openPoolIndices.add(this.poolIndex);
    }

    placeFood() {
        let emptyCells = [];
        for(let w = 0; w < BOARD_SIZE; w++) {
            for(let z = 0; z < BOARD_SIZE; z++) {
                for(let y = 0; y < BOARD_SIZE; y++) {
                    for(let x = 0; x < BOARD_SIZE; x++) {
                        if(this.board[w][z][y][x] === BoardState.Empty) {
                            emptyCells.push(new Vector4(x, y, z, w));
                        }
                    }
                }
            }
        }

        if(emptyCells.length > 0) {
            const foodPos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.board[foodPos.w][foodPos.z][foodPos.y][foodPos.x] = BoardState.Food;
        }
    }
}

const HISTORY_LENGTH = 25;

/** @type {[HTMLDivElement, CanvasRenderingContext2D][]} */
BoardSnapshot.canvasPool = new Array(HISTORY_LENGTH + 10).fill(null).map(() => {
    const container = document.createElement('div');
    container.classList.add('board-snapshot');
    
    const canvas = document.createElement('canvas');
    canvas.classList.add('board-canvas');
    const ctx = canvas.getContext('2d');
    const header = document.createElement('span');
    header.classList.add('board-header');

    container.appendChild(canvas);
    container.appendChild(header);

    document.getElementById("boards").appendChild(container);
    return [container, ctx];
});
BoardSnapshot.openPoolIndices = new Set(Array.from(Array(BoardSnapshot.canvasPool.length).keys()));

export class Game {
    /** @type {GameStage[keyof GameStage]} */
    gameStage = GameStage.Start;
    totalAttempts = 0;

    tesseract = new Tesseract();
    dialogue = new Dialogue();
    particles = new Particles();

    /** 
     * The current (latest) board state
     * @type {BoardSnapshot}
    */
    board;

    /** @type {BoardSnapshot[]} */
    previousBoards = [];

    historyScrollPosition = 0;

    timeoutId = null;

    /** A monotonically increasing timestamp that updates only while the game is updating */
    timestamp = 0;

    advance() {
        if(this.dialogue.active) return;
        if(this.board.gameOver) return;

        const newBoard = this.board.advance();
        this.previousBoards.push(this.board);
        if(this.previousBoards.length > HISTORY_LENGTH) {
            this.previousBoards[0].remove();
            this.previousBoards.shift();
        }

        this.board = newBoard;

        playSound('tick', { volume: 0.3, pitch: 0.9 + Math.random() * 0.2 });
    }

    run() {
        if(this.historyScrollPosition > 0) {
            this.timeoutId = null;
            return;
        }
        this.timeoutId = setTimeout(() => {
            this.timestamp += 500 / this.board.speed;
            this.advance();
            this.run();
        }, 500 / this.board.speed);
    }

    restart() {
        if(this.board) {
            emitResetParticles(this.board);
            this.board.remove();
        }
        this.previousBoards.forEach(b => b.remove());
        this.previousBoards = [];

        this.board = new BoardSnapshot();
        this.previousBoards.push(this.board);

        this.board.initBoard();
        this.board.snake = new Snake();
        this.board.snake.updateBoard();
        this.board.placeFood();

        this.totalAttempts += 1;

        playSound('restart');
    }

    scrollSoundDebounce = 0;

    scrollHistory(delta) {
        if(this.dialogue.active) return;
        if(this.gameStage !== GameStage.FiveD) return;
        
        const oldHistoryPosition = this.historyScrollPosition;
        this.historyScrollPosition += delta * 0.002;
        this.historyScrollPosition = Math.max(0, this.historyScrollPosition);
        this.historyScrollPosition = Math.min(this.previousBoards.length + 1, this.historyScrollPosition);

        const now = performance.now();
        if(now - this.scrollSoundDebounce > 0 && Math.floor(this.historyScrollPosition) !== Math.floor(oldHistoryPosition)) {
            playSound('cycleHistory', { pitch: 0.6 + Math.random() * 0.4, volume: 0.4 });
            this.scrollSoundDebounce = now + 100 + Math.random() * 50;
        }
        
        if(this.historyScrollPosition > 0) {
            if(this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
        } else {
            if(!this.timeoutId) {
                this.run();
            }
        }
    }
}

export const game = new Game();

game.restart();
game.run();

export const heldKeys = new Set();

// Controls
document.addEventListener('keydown', (e) => {
    heldKeys.add(e.key);

    if(game.dialogue.active) {
        game.dialogue.next();
        return;
    }

    // We have more directions to move in than normal snake, but thankfully
    // both WASD and IJKL are pretty standard and make it intuitive enough
    switch(e.key) {
        case 'w': game.board.snake.setDirection(new Vector4(0, -1, 0, 0)); break; // Up
        case 's': game.board.snake.setDirection(new Vector4(0, 1, 0, 0)); break; // Down
        case 'a': game.board.snake.setDirection(new Vector4(-1, 0, 0, 0)); break; // Left
        case 'd': game.board.snake.setDirection(new Vector4(1, 0, 0, 0)); break; // Right
        case 'i': game.board.snake.setDirection(new Vector4(0, 0, -1, 0)); break; // Forward (Z-)
        case 'k': game.board.snake.setDirection(new Vector4(0, 0, 1, 0)); break; // Backward (Z+)
        case 'j': game.board.snake.setDirection(new Vector4(0, 0, 0, -1)); break; // W-
        case 'l': game.board.snake.setDirection(new Vector4(0, 0, 0, 1)); break; // W+
        case ' ': {
            if(game.historyScrollPosition > 0) {
                const targetIndex = game.previousBoards.length - Math.round(game.historyScrollPosition) + 1;
                if(targetIndex >= 0 && targetIndex < game.previousBoards.length) {
                    const targetBoard = game.previousBoards[targetIndex];

                    // targetIndex becomes 0, so
                    game.historyScrollPosition -= game.previousBoards.length - targetIndex;

                    // Reset speed when traveling
                    // This is the key advantage, but it's kind of hidden?
                    // Not very good game design but oh well
                    targetBoard.speed = 1;
                    
                    game.board.remove();
                    game.board = targetBoard.clone();
                    for(let i = game.previousBoards.length - 1; i >= targetIndex; i--) {
                        game.previousBoards[i].remove();
                    }
                    game.previousBoards = game.previousBoards.slice(0, targetIndex);

                    playSound('timeTravel', { pitch: 0.8 + Math.random() * 0.4, volume: 1.0 });
                }
            }
            if(game.board.gameOver) {
                game.restart();
            }
            break;
        }
    }
});
document.addEventListener('keyup', (e) => {
    heldKeys.delete(e.key);
});

document.addEventListener('wheel', (e) => {
    game.scrollHistory(e.deltaY);
});

render(performance.now());