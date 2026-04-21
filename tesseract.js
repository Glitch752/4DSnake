/** the tutorial character */
export class Tesseract {
    constructor() {
        this.x = 20;
        this.y = 20;
        this.size = 60;
        this.color = '#00e6ff';
        this.eyeColor = '#fff';
    }

    draw(ctx) {
        // simple 2D projection of a tesseract (cube within a cube)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        // outer cube
        ctx.strokeRect(0, 0, this.size, this.size);
        // inner cube
        ctx.strokeRect(this.size*0.2, this.size*0.2, this.size*0.6, this.size*0.6);
        // corners
        for(let i = 0; i < 4; i++) {
            let dx = (i%2) * this.size * 0.8;
            let dy = (i>>1) * this.size * 0.8;
            ctx.beginPath();
            ctx.moveTo(dx, dy);
            ctx.lineTo(dx+this.size*0.2, dy+this.size*0.2);
            ctx.stroke();
        }

        // Eyes lol
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(this.size*0.35, this.size*0.4, 4, 0, 2*Math.PI);
        ctx.arc(this.size*0.65, this.size*0.4, 4, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    }
}
