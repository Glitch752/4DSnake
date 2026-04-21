// @ts-check

import { Vector4 } from "./vector4.js";
import { Tutorial } from "./tutorial.js";
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

export class Game {
    /** @type {BoardState[keyof BoardState][][][][]} */
    board = [];
    score = 0;
    gameOver = false;

    snake = new Snake();

    tesseract = new Tesseract();
    tutorial = new Tutorial();
    particles = new Particles();

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

game.initBoard();
game.snake.updateBoard();
game.placeFood();

setInterval(() => {
    game.snake.move();
}, 500);


// Controls
document.addEventListener('keydown', (e) => {
    if(game.tutorial.active) {
        game.tutorial.next();
        return;
    }

    // We have more directions to move in than normal snake, but thankfully
    // both WASD and IJKL are pretty standard and make it intuitive enough
    switch(e.key) {
        case 'w': game.snake.setDirection(new Vector4(0, -1, 0, 0)); break; // Up
        case 's': game.snake.setDirection(new Vector4(0, 1, 0, 0)); break; // Down
        case 'a': game.snake.setDirection(new Vector4(-1, 0, 0, 0)); break; // Left
        case 'd': game.snake.setDirection(new Vector4(1, 0, 0, 0)); break; // Right
        case 'i': game.snake.setDirection(new Vector4(0, 0, -1, 0)); break; // Forward (Z-)
        case 'k': game.snake.setDirection(new Vector4(0, 0, 1, 0)); break; // Backward (Z+)
        case 'j': game.snake.setDirection(new Vector4(0, 0, 0, -1)); break; // W-
        case 'l': game.snake.setDirection(new Vector4(0, 0, 0, 1)); break; // W+
    }
});

render(performance.now());