export class Vector4 {
    static PosX = new Vector4(1, 0, 0, 0);
    static NegX = new Vector4(-1, 0, 0, 0);
    static PosY = new Vector4(0, 1, 0, 0);
    static NegY = new Vector4(0, -1, 0, 0);
    static PosZ = new Vector4(0, 0, 1, 0);
    static NegZ = new Vector4(0, 0, -1, 0);
    static PosW = new Vector4(0, 0, 0, 1);
    static NegW = new Vector4(0, 0, 0, -1);

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