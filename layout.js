import { canvas } from "./rendering.js";

export const BOARD_SIZE = 4;

// So we can dynamically change layout maybe?

export function calculateLayout() {
    const canvasPadding = 20;
    const boardPixelSize = Math.min(canvas.width - canvasPadding * 2, canvas.height - canvasPadding * 2);
    const planeGap = boardPixelSize * 0.02;
    const planeSize = (boardPixelSize - planeGap * (BOARD_SIZE - 1)) / BOARD_SIZE;
    const cellGap = planeSize * 0.04;
    const cellSize = (planeSize - cellGap * (BOARD_SIZE + 1)) / BOARD_SIZE;
    const usedWidth = planeSize * BOARD_SIZE + planeGap * (BOARD_SIZE - 1);
    const usedHeight = usedWidth;

    return {
        planeSize,
        planeGap,
        cellSize,
        cellGap,
        offsetX: canvasPadding,
        offsetY: (canvas.height - usedHeight) * 0.5,
        boardPixelSize: usedWidth
    };
}

export function getPlaneRect(layout, w, z) {
    const x = layout.offsetX + w * (layout.planeSize + layout.planeGap);
    const y = layout.offsetY + z * (layout.planeSize + layout.planeGap);
    return { x, y, width: layout.planeSize, height: layout.planeSize };
}

export function getCellRect(layout, pos) {
    const plane = getPlaneRect(layout, pos.w, pos.z);
    return {
        x: plane.x + layout.cellGap + pos.x * (layout.cellSize + layout.cellGap),
        y: plane.y + layout.cellGap + pos.y * (layout.cellSize + layout.cellGap),
        width: layout.cellSize,
        height: layout.cellSize
    };
}
