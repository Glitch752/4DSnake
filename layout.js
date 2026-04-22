import { canvas } from "./rendering.js";

export const BOARD_SIZE = 4;

// So we can dynamically change layout maybe?

export function calculateLayout() {
    const canvasPadding = 20;
    const topPadding = 50;

    const boardPixelSize = Math.min(
        canvas.width - canvasPadding * 2,
        canvas.height - canvasPadding * 2 - topPadding
    );
    const planeGap = boardPixelSize * 0.02;
    const planeSize = (boardPixelSize - planeGap * (BOARD_SIZE - 1)) / BOARD_SIZE;
    const cellPadding = planeSize * 0.02;
    const cellSize = planeSize / BOARD_SIZE;
    const usedWidth = planeSize * BOARD_SIZE + planeGap * (BOARD_SIZE - 1);
    const usedHeight = usedWidth;

    return {
        planeSize,
        planeGap,
        cellSize,
        cellPadding,
        offsetX: canvasPadding,
        offsetY: (canvas.height - usedHeight + topPadding) * 0.5,
        boardPixelSize: usedWidth
    };
}

export function getPlaneRect(layout, w, z) {
    const x = w * (layout.planeSize + layout.planeGap);
    const y = z * (layout.planeSize + layout.planeGap);
    return { x, y, width: layout.planeSize, height: layout.planeSize };
}

export function getCellRect(layout, pos) {
    const plane = getPlaneRect(layout, pos.w, pos.z);
    return {
        x: plane.x + pos.x * layout.cellSize + layout.cellPadding,
        y: plane.y + pos.y * layout.cellSize + layout.cellPadding,
        width: layout.cellSize - layout.cellPadding * 2,
        height: layout.cellSize - layout.cellPadding * 2
    };
}

export function getCellCenter(layout, pos) {
    const rect = getCellRect(layout, pos);
    return {
        x: rect.x + rect.width * 0.5,
        y: rect.y + rect.height * 0.5
    };
}