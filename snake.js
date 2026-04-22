import { fastDeathSteps, firstDeathSteps } from "./dialogue.js";
import { BoardState, game, GameStage } from "./game.js";
import { BOARD_SIZE } from "./layout.js";
import { emitCrashParticles, emitEatParticles } from "./rendering.js";
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

    updateBoard(board = game.board.board) {
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

    clone() {
        const clone = new Snake();
        clone.direction = this.direction.clone();
        clone.nextDirection = this.nextDirection.clone();
        clone.body = this.body.map(segment => segment.clone());
        clone.alive = this.alive;
    }

    move() {
        if(!this.alive || game.dialogue.active) return;

        this.direction = this.nextDirection;
        const newHead = this.body[0].plus(this.direction);
        // Wrap
        newHead.x = (newHead.x + BOARD_SIZE) % BOARD_SIZE;
        newHead.y = (newHead.y + BOARD_SIZE) % BOARD_SIZE;
        newHead.z = (newHead.z + BOARD_SIZE) % BOARD_SIZE;
        newHead.w = (newHead.w + BOARD_SIZE) % BOARD_SIZE;

        // Check for food
        const grow = game.board[newHead.w][newHead.z][newHead.y][newHead.x] === BoardState.Food;

        // Check for self-collision
        if(
            game.board[newHead.w][newHead.z][newHead.y][newHead.x] === BoardState.Snake &&
            // Allow moving into tail if not growing, since it will move away
            !(newHead.equals(this.body[this.body.length - 1]) && !grow)
        ) {
            this.alive = false;
            emitCrashParticles(newHead);

            if(game.gameStage === GameStage.Start) {
                game.dialogue.queue(firstDeathSteps);
                game.dialogue.onFinish(() => {
                    game.gameStage = GameStage.FailedOnce;
                });
            }
            if(game.gameStage === GameStage.FailedOnce && game.board.speed > 3) {
                game.dialogue.queue(fastDeathSteps);
                game.dialogue.onFinish(() => {
                    game.gameStage = GameStage.FiveD;
                });
            }
            return;
        }

        if(grow) {
            emitEatParticles(newHead);
        }

        this.body.unshift(newHead); // Add new head
        if(!grow) this.body.pop(); // Remove tail

        this.updateBoard();

        if(grow) {
            game.placeFood();
        }
    }
}