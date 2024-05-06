declare global {
    interface Number {
        ceil(): number;

        floor(): number;

        round(): number;
    }
}

Number.prototype.ceil = function (): number {
    return Math.ceil(this.valueOf());
};

Number.prototype.floor = function (): number {
    return Math.floor(this.valueOf());
};

Number.prototype.round = function (): number {
    return Math.round(this.valueOf());
};