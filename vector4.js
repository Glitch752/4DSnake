export class Vector4 {
    constructor(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    plus(other) {
        return new Vector4(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
    }

    minus(other) {
        return new Vector4(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
    }

    modulo(size) {
        return new Vector4(
            (this.x + size) % size,
            (this.y + size) % size,
            (this.z + size) % size,
            (this.w + size) % size
        );
    }
    
    equals(other) {
        return this.x === other.x && this.y === other.y && this.z === other.z && this.w === other.w;
    }

    adjacentTo(other) {
        const dx = Math.abs(this.x - other.x);
        const dy = Math.abs(this.y - other.y);
        const dz = Math.abs(this.z - other.z);
        const dw = Math.abs(this.w - other.w);
        return (dx + dy + dz + dw === 1);
    }

    clone() {
        return new Vector4(this.x, this.y, this.z, this.w);
    }
}