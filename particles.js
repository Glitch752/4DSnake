const conversionCtx = document.createElement("canvas").getContext("2d");

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * @param {string} color
 * @returns {[number, number, number]}
 */
function getColorComponents(color) {
    conversionCtx.fillStyle = color;
    let r = parseInt(conversionCtx.fillStyle.slice(1, 3), 16);
    let g = parseInt(conversionCtx.fillStyle.slice(3, 5), 16);
    let b = parseInt(conversionCtx.fillStyle.slice(5, 7), 16);
    return [r, g, b];
}

export class Particles {
    /** @type { {x: number, y: number, lifetime: number, maxLifetime: number, vx: number, vy: number, color: string, size: number}[] } */
    particles = [];

    /**
     * Emit a particle at the given position with the given velocity and lifetime.
     * @param {number} x
     * @param {number} y
     * @param {number} vx
     * @param {number} vy
     * @param {number} lifetime
     * @param {string} color
     * @param {number} [size=2]
     */
    emit(x, y, vx, vy, lifetime, color, size = 2) {
        this.particles.push({
            x,
            y,
            vx,
            vy,
            lifetime,
            maxLifetime: lifetime,
            color,
            size
        });
    }

    /**
     * Randomize a color slightly by adjusting its RGB components.
     * @param {[number, number, number]} color
     * @param {number} amount
     * @returns {string}
     */
    randomizeColor(color, amount) {
        let [r, g, b] = color;
        r += (Math.random() * 2 - 1) * amount * 255;
        g += (Math.random() * 2 - 1) * amount * 255;
        b += (Math.random() * 2 - 1) * amount * 255;
        r = clamp(r, 0, 255);
        g = clamp(g, 0, 255);
        b = clamp(b, 0, 255);
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }

    /**
     * Emit a burst of particles spread across the outline of a rectangle.
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} count
     * @param {number} speed
     * @param {number} lifetime
     * @param {string} colorString
     */
    emitRectBurst(x, y, width, height, count, speed, lifetime, colorString) {
        const color = getColorComponents(colorString);
        const perimeter = 2 * (width + height);
        for(let i = 0; i < count; i++) {
            const dist = Math.random() * perimeter;
            let px, py;
            if(dist < width) {
                // Top edge
                px = x + dist;
                py = y;
            } else if(dist < width + height) {
                // Right edge
                px = x + width;
                py = y + (dist - width);
            } else if(dist < 2 * width + height) {
                // Bottom edge
                px = x + (dist - width - height);
                py = y + height;
            } else {
                // Left edge
                px = x;
                py = y + (dist - 2 * width - height);
            }
            this.emit(
                px,
                py,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed,
                lifetime * (0.5 + Math.random() * 0.5),
                this.randomizeColor(color, 0.1),
                1.5 + Math.random() * 2.5
            );
        }
    }

    /**
     * Emit a burst of particles along a line segment.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} countPerLength
     * @param {number} speed
     * @param {number} lifetime
     * @param {string} colorString
     * @param {number} [biasVelocityTowardEnd=0]
     */
    emitLineBurst(x1, y1, x2, y2, countPerLength, speed, lifetime, colorString, biasVelocityTowardEnd = 0) {
        const color = getColorComponents(colorString);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        if(length < 0.0001) return;
        const count = Math.floor(length * countPerLength);
        const normDx = dx / length;
        const normDy = dy / length;
        const lineAngle = Math.atan2(dy, dx);

        for(let i = 0; i < count; i++) {
            const t = Math.random();
            const px = x1 + normDx * length * t;
            const py = y1 + normDy * length * t;

            const velocityMagnitude = (Math.random() - 0.5) * speed;
            const angle = lineAngle + (Math.random() - 0.5) * Math.PI * (1.0 - biasVelocityTowardEnd);
            const vx = Math.cos(angle) * velocityMagnitude;
            const vy = Math.sin(angle) * velocityMagnitude;

            this.emit(px, py, vx, vy, lifetime * (0.5 + Math.random() * 0.5), this.randomizeColor(color, 0.1), 1.5 + Math.random() * 1.5);
        }
    }

    /**
     * Emit a burst of particles in a circle.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {number} count
     * @param {number} speed
     * @param {number} lifetime
     * @param {string} colorString
     */
    emitCircleBurst(x, y, radius, count, speed, lifetime, colorString) {
        const color = getColorComponents(colorString);
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            const vx = Math.cos(angle) * speed * (0.5 + Math.random() * 0.5);
            const vy = Math.sin(angle) * speed * (0.5 + Math.random() * 0.5);
            this.emit(px, py, vx, vy, lifetime * (0.5 + Math.random() * 0.5), this.randomizeColor(color, 0.1), 2 + Math.random() * 3);
        }
    }

    /**
     * Emit a directional burst of particles from a point.
     * @param {number} x
     * @param {number} y
     * @param {number} directionX
     * @param {number} directionY
     * @param {number} spread
     * @param {number} count
     * @param {number} speed
     * @param {number} lifetime
     * @param {string} colorString
     */
    emitDirectionalBurst(x, y, directionX, directionY, spread, count, speed, lifetime, colorString) {
        const color = getColorComponents(colorString);

        const dirLength = Math.sqrt(directionX * directionX + directionY * directionY);
        if(dirLength < 0.0001) return;
        const normDirX = directionX / dirLength;
        const normDirY = directionY / dirLength;
        for(let i = 0; i < count; i++) {
            const angle = (Math.random() - 0.5) * spread;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const vx = (normDirX * cos - normDirY * sin) * speed * (0.5 + Math.random() * 0.5);
            const vy = (normDirX * sin + normDirY * cos) * speed * (0.5 + Math.random() * 0.5);
            this.emit(x, y, vx, vy, lifetime * (0.5 + Math.random() * 0.5), this.randomizeColor(color, 0.1), 1.5 + Math.random() * 2);
        }
    }

    /**
     * Update all particles.
     * @param {number} deltaTime Time elapsed since last update in seconds.
     */
    update(deltaTime) {
        const drag = Math.pow(0.985, deltaTime * 60);
        for(let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.lifetime -= deltaTime;
            if(p.lifetime <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.vx *= drag;
            p.vy *= drag;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
        }
    }

    /**
     * Draw all particles.
     * The canvas should be appropriately transformed such that drawing scaled to the canvas in world space is moved to screen space.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        for(const p of this.particles) {
            const lifeRatio = clamp(p.lifetime / p.maxLifetime, 0, 1);
            ctx.globalAlpha = Math.min(1, lifeRatio * 1.2);

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.7 + 0.3 * lifeRatio), 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha *= 0.3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
}