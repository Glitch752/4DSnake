import { Vector4 } from "./vector4.js";
import { Dialogue } from "./dialogue.js";
import { Tesseract } from "./tesseract.js";
import { Particles } from "./particles.js";
import { BOARD_SIZE } from "./layout.js";
import { Snake } from "./snake.js";
import { render } from "./rendering.js";

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
    snake;

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
        ss.snake.move();
        if(!ss.snake.alive) {
            ss.gameOver = true;
        }
        ss.score += ss.snake.body.length - game.board.snake.body.length;
        ss.snake.updateBoard(ss.board);
        return ss;
    }
}

export class Game {
    /** @type {GameStage[keyof GameStage]} */
    gameStage = GameStage.Start;

    tesseract = new Tesseract();
    dialogue = new Dialogue();
    particles = new Particles();

    /** The current (latest) board state */
    board = new BoardSnapshot();

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

export const game = new Game();

game.board.initBoard();
game.board.snake = new Snake();
game.board.snake.updateBoard();
game.placeFood();

setInterval(() => {
    game.board.advance();
}, 500);


// Controls
document.addEventListener('keydown', (e) => {
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
    }
});

render(performance.now());