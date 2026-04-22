import { clamp, lerp, lerpColor } from "./math.js";
import { BOARD_SIZE, calculateLayout, getPlaneRect, getCellRect, getCellCenter } from "./layout.js";
import { BoardSnapshot, BoardState, game, GameStage } from "./game.js";
import { Vector4 } from "./vector4.js";

export const canvas = /** @type {HTMLCanvasElement} */(
    document.getElementById('gameCanvas')
);
export const ctx = canvas.getContext('2d');

let latestLayout = null;

// an ""enum""
export const Palette = {
    BoardBg: '#171b21',
    CellBgEven: '#141f33',
    CellBgOdd: '#16253a',

    SnakeHead: '#7ff5a1',
    SnakeBodyStart: '#5ae083',
    SnakeBodyEnd: '#28a45a',
    Food: '#ff6b6b',

    Tesseract: '#00e6ff',
    Player: '#61618d',
    Danger: '#ff4c4c',
};

export function emitEatParticles(cell) {
    if(!latestLayout) return;
    const center = getCellCenter(latestLayout, cell);
    const radius = Math.max(4, latestLayout.cellSize * 0.3);
    game.particles.emitCircleBurst(center.x, center.y, radius, 28, 170, 0.55, Palette.Food);
}

export function emitCrashParticles(cell) {
    if(!latestLayout) return;
    const center = getCellCenter(latestLayout, cell);
    game.particles.emitCircleBurst(center.x, center.y, latestLayout.cellSize * 0.4, 70, 220, 0.8, Palette.Danger);
}

function drawRect(ctx, x, y, width, height) {
    // For now, just normal rect?
    ctx.fillRect(x, y, width, height);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {*} layout 
 * @param {BoardSnapshot} board 
 */
function drawBoard(ctx, layout, board) {
    for(let w = 0; w < BOARD_SIZE; w++) {
        for(let z = 0; z < BOARD_SIZE; z++) {
            for(let y = 0; y < BOARD_SIZE; y++) {
                for(let x = 0; x < BOARD_SIZE; x++) {
                    const pos = new Vector4(x, y, z, w);
                    const rect = getCellRect(layout, pos);

                    ctx.fillStyle = (x + y) % 2 === 0 ? Palette.CellBgEven : Palette.CellBgOdd;

                    drawRect(
                        ctx,
                        rect.x - layout.cellPadding, rect.y - layout.cellPadding,
                        rect.width + layout.cellPadding * 2, rect.height + layout.cellPadding * 2
                    );
                    ctx.fill();

                    // highlight next cells lightly
                    if(pos.adjacentTo(board.snake.body[0]) && board.board[w][z][y][x] !== BoardState.Snake) {
                        ctx.fillStyle = '#ffffff04';
                        drawRect(ctx, rect.x, rect.y, rect.width, rect.height);
                        ctx.fill();
                    }

                    if(board.board[w][z][y][x] === BoardState.Food) {
                        ctx.fillStyle = Palette.Food;
                        const size = rect.width * 0.6;
                        drawRect(
                            ctx,
                            rect.x + rect.width * 0.5 - size * 0.5, rect.y + rect.height * 0.5 - size * 0.5,
                            size, size
                        );
                        ctx.fill();
                    }
                }
            }
        }
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {*} layout
 * @param {BoardSnapshot} board
 */
function drawBoardOverlays(ctx, layout, board) {
    if(board.gameOver) {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, layout.boardPixelSize, layout.boardPixelSize);
        ctx.globalAlpha = 1;

        ctx.font = "32px monospace";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            "press space to restart",
            layout.boardPixelSize / 2,
            layout.boardPixelSize / 2
        );
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
    }
}

function drawRoundedRect(ctx, x, y, width, height, { tl = 0, tr = 0, bl = 0, br = 0 } = {}) {
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + width - tr, y);
    if(tr > 0) ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
    else ctx.lineTo(x + width, y);

    ctx.lineTo(x + width, y + height - br);
    if(br > 0) ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
    else ctx.lineTo(x + width, y + height);

    ctx.lineTo(x + bl, y + height);
    if(bl > 0) ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
    else ctx.lineTo(x, y + height);

    ctx.lineTo(x, y + tl);
    if(tl > 0) ctx.quadraticCurveTo(x, y, x + tl, y);
    else ctx.lineTo(x, y);

    ctx.closePath();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {*} layout 
 * @param {BoardSnapshot} board
 */
function drawSnake(ctx, layout, board) {
    const snake = board.snake;

    const segmentCount = snake.body.length;
    for (let i = segmentCount - 1; i >= 0; i--) {
        const segment = snake.body[i];
        const rect = getCellRect(layout, segment);
        const t = segmentCount <= 1 ? 0 : i / (segmentCount - 1);
        const color = i === 0
            ? Palette.SnakeHead
            : lerpColor(Palette.SnakeBodyStart, Palette.SnakeBodyEnd, t);

        const prev = snake.body[i - 1], next = snake.body[i + 1];

        // connect sides with previous and next adjacency
        const topAdj = prev && prev.y < segment.y && prev.adjacentTo(segment) || next && next.y < segment.y && next.adjacentTo(segment);
        const leftAdj = prev && prev.x < segment.x && prev.adjacentTo(segment) || next && next.x < segment.x && next.adjacentTo(segment);
        const rightAdj = prev && prev.x > segment.x && prev.adjacentTo(segment) || next && next.x > segment.x && next.adjacentTo(segment);
        const bottomAdj = prev && prev.y > segment.y && prev.adjacentTo(segment) || next && next.y > segment.y && next.adjacentTo(segment);

        ctx.fillStyle = color;
        const radius = rect.width * 0.05;
        // This creates a funky color mixing thing but we're going to call it a
        // Feature Not a Bug
        if(topAdj)    drawRect(ctx, rect.x, rect.y - layout.cellPadding - 1, rect.width, layout.cellPadding + 2);
        if(bottomAdj) drawRect(ctx, rect.x, rect.y + rect.height - 1, rect.width, layout.cellPadding + 2);
        if(leftAdj)   drawRect(ctx, rect.x - layout.cellPadding - 1, rect.y, layout.cellPadding + 2, rect.height);
        if(rightAdj)  drawRect(ctx, rect.x + rect.width - 1, rect.y, layout.cellPadding + 2, rect.height);

        drawRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, {
            tl: topAdj    || leftAdj  ? 0 : radius,
            tr: topAdj    || rightAdj ? 0 : radius,
            bl: bottomAdj || leftAdj  ? 0 : radius,
            br: bottomAdj || rightAdj ? 0 : radius
        });

        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(
            rect.x + rect.width * 0.11,
            rect.y + rect.height * 0.12,
            rect.width * 0.58,
            rect.height * 0.26,
            radius * 0.4
        );
        ctx.fill();
    }

    const headRect = getCellRect(layout, snake.body[0]);
    const eyeOffsetX = snake.nextDirection.x !== 0 ? snake.nextDirection.x * headRect.width * 0.2 : 0;
    const eyeOffsetY = snake.nextDirection.y !== 0 ? snake.nextDirection.y * headRect.height * 0.2 : 0;
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

    ctx.textBaseline = 'top';
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = '#fff';
    if(game.gameStage != GameStage.FiveD) {
        ctx.fillText(`4D Snake`, 25, 15);
    } else {
        ctx.fillText(`5D Snake With Time Travel`, 25, 15);
    }

    const deltaTime = clamp((now - lastRenderTime) / 1000, 0, 0.04);
    lastRenderTime = now;
    game.particles.update(deltaTime);

    latestLayout = calculateLayout();
    
    for(let i = 0; i < game.previousBoards.length + 1; i++) {
        const snapshot = i === game.previousBoards.length ? game.board : game.previousBoards[i];
        
        let resized = false;
        if(snapshot.canvas.width != latestLayout.boardPixelSize || snapshot.canvas.height != latestLayout.boardPixelSize) {
            snapshot.canvas.width = latestLayout.boardPixelSize;
            snapshot.canvas.height = latestLayout.boardPixelSize;
            resized = true;
        }

        // Update perspective
        const perspective = Math.min(1, game.historyScrollPosition);

        const indexFromCurrent = game.previousBoards.length - i;

        snapshot.canvas.style.transform = `\
perspective(${5000 - Math.sqrt(perspective) * 4000}px) \
scale(${lerp(1.0, 0.6, perspective)}) \
rotateX(${perspective * -40}deg) \
rotateY(${perspective * 20}deg) \
translateZ(${indexFromCurrent * -500 + Math.max(0, game.historyScrollPosition - 1) * 500}px)`;

        snapshot.canvas.style.opacity = (1 - (indexFromCurrent - game.historyScrollPosition) / game.previousBoards.length / Math.max(perspective, 0.0001)).toFixed(3);
        snapshot.canvas.style.zIndex = (100 - indexFromCurrent).toString();

        if(i === game.previousBoards.length || resized) {
            snapshot.ctx.clearRect(0, 0, snapshot.canvas.width, snapshot.canvas.height);
            drawBoard(snapshot.ctx, latestLayout, snapshot);
            drawSnake(snapshot.ctx, latestLayout, snapshot);
            drawBoardOverlays(snapshot.ctx, latestLayout, snapshot);
        }
        if(i === game.previousBoards.length) {
            game.particles.draw(snapshot.ctx); 
        }
    }
       
    game.dialogue.draw(ctx, game.tesseract);
    game.tesseract.draw();

    requestAnimationFrame(render);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
