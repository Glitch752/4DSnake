// @ts-check

import { clamp, lerpColor } from "./math.js";
import { BOARD_SIZE, calculateLayout, getPlaneRect, getCellRect } from "./layout.js";
import { BoardState, game } from "./game.js";
import { Vector4 } from "./vector4.js";
export const canvas = /** @type {HTMLCanvasElement} */(
    document.getElementById('gameCanvas')
);
export const ctx = canvas.getContext('2d');

// an ""enum""
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


function drawRect(ctx, x, y, width, height, radius) {
    // For now, just normal rect?
    ctx.fillRect(x, y, width, height);
}

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
                    drawRect(
                        ctx,
                        rect.x - layout.cellGap, rect.y - layout.cellGap,
                        rect.width + layout.cellGap * 2, rect.height + layout.cellGap * 2,
                        rect.width * 0.18
                    );
                    ctx.fill();

                    if(game.board[w][z][y][x] === BoardState.Food) {
                        ctx.fillStyle = Palette.Food;
                        const size = rect.width * 0.6;
                        drawRect(ctx, rect.x + rect.width * 0.5 - size * 0.5, rect.y + rect.height * 0.5 - size * 0.5, size, size, size * 0.2);
                        ctx.fill();
                    }
                }
            }
        }
    }
}

function drawSnake(snake, layout) {
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

let lastRenderTime = performance.now();
export function render(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const deltaTime = clamp((now - lastRenderTime) / 1000, 0, 0.04);
    lastRenderTime = now;
    game.particles.update(deltaTime);

    let layout = calculateLayout();
    drawBoard(layout);
    drawSnake(game.snake, layout);
    game.particles.draw(ctx);

    game.tutorial.draw(ctx, game.tesseract);
    game.tesseract.draw();

    requestAnimationFrame(render);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
