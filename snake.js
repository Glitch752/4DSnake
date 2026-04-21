import { BoardState, game } from "./game.js";
import { BOARD_SIZE } from "./layout.js";
import { Vector4 } from "./vector4.js";

export class Snake {
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
                        if(game.board[w][z][y][x] === BoardState.Snake) {
                            game.board[w][z][y][x] = BoardState.Empty;
                        }
                    }
                }
            }
        }

        // Set new snake position
        for(const segment of this.body) {
            game.board[segment.w][segment.z][segment.y][segment.x] = BoardState.Snake;
        }
    }

    move() {
        if(!this.alive || game.gameOver || game.tutorial.active) return;

        this.direction = this.nextDirection;
        const newHead = this.body[0].add(this.direction);
        // Wrap
        newHead.x = (newHead.x + BOARD_SIZE) % BOARD_SIZE;
        newHead.y = (newHead.y + BOARD_SIZE) % BOARD_SIZE;
        newHead.z = (newHead.z + BOARD_SIZE) % BOARD_SIZE;
        newHead.w = (newHead.w + BOARD_SIZE) % BOARD_SIZE;

        // Check for self-collision
        if(game.board[newHead.w][newHead.z][newHead.y][newHead.x] === BoardState.Snake) {
            this.alive = false;
            game.gameOver = true;
            return;
        }

        // Check for food
        const grow = game.board[newHead.w][newHead.z][newHead.y][newHead.x] === BoardState.Food;

        this.body.unshift(newHead); // Add new head
        if(!grow) this.body.pop(); // Remove tail

        this.updateBoard();

        if(grow) {
            game.score += 1;
            game.placeFood();
        }
    }
}