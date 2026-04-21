import { ctx } from "./game.js";

/** the tutorial character */
export class Tesseract {
    get y() {
        return ctx.canvas.height - Math.sin(Date.now() * 0.002) * 5 - this.size - 100;
    }
    get x() {
        return ctx.canvas.width - 200;
    }

    constructor() {
        this.size = 70;
        this.color = '#00e6ff';
        this.eyeColor = '#fff';
    }

    draw() {
        // One of those like cliche visualizations of the
        // rotating hypercube
        ctx.save();
        ctx.translate(this.x, this.y);

        const s = this.size / 2;
        const vertices4D = [];
        for (let i = 0; i < 16; i++) {
            vertices4D.push([
                (i & 1 ? 1 : -1) * s,
                (i & 2 ? 1 : -1) * s,
                (i & 4 ? 1 : -1) * s,
                (i & 8 ? 1 : -1) * s
            ]);
        }

        const t = Date.now() * 0.001;
        function rotate4D([x, y, z, w], a, b) {
            // rotate in the (a,b) plane by angle t
            const v = [x, y, z, w];
            const ca = Math.cos(t), sa = Math.sin(t);
            const va = v[a], vb = v[b];
            v[a] = ca * va - sa * vb;
            v[b] = sa * va + ca * vb;
            return v;
        }

        function project4Dto3D([x, y, z, w]) {
            const d = 100;
            const wProj = 1 / (d - w);
            return [x * wProj, y * wProj, z * wProj];
        }
        function project3Dto2D([x, y, z]) {
            const d = 2;
            const zProj = 1 / (d - z);
            return [x * zProj * this.size * d + s, y * zProj * this.size * d + s];
        }

        // apply rotation and projection
        const points2D = vertices4D.map(v => {
            let r = rotate4D(v, 0, 3); // XW
            r = rotate4D(r, 1, 2);     // YZ
            // r = rotate4D(r, 1, 3);     // YW
            const p3 = project4Dto3D(r);
            return project3Dto2D.call(this, p3);
        });

        // draw edges
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        for(let i = 0; i < 16; i++) {
            for(let j = i + 1; j < 16; j++) {
                // connect if adjacent (one bit difference)
                if(((i ^ j) & ((i ^ j) - 1)) === 0) {
                    ctx.beginPath();
                    ctx.moveTo(points2D[i][0], points2D[i][1]);
                    ctx.lineTo(points2D[j][0], points2D[j][1]);
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }
}
