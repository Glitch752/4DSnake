export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
    return a + (b - a) * t;
}

export function lerpColor(hexA, hexB, t) {
    const a = [
        parseInt(hexA.slice(1, 3), 16),
        parseInt(hexA.slice(3, 5), 16),
        parseInt(hexA.slice(5, 7), 16)
    ];
    const b = [
        parseInt(hexB.slice(1, 3), 16),
        parseInt(hexB.slice(3, 5), 16),
        parseInt(hexB.slice(5, 7), 16)
    ];
    const r = Math.round(lerp(a[0], b[0], t));
    const g = Math.round(lerp(a[1], b[1], t));
    const bl = Math.round(lerp(a[2], b[2], t));
    return `rgb(${r}, ${g}, ${bl})`;
}