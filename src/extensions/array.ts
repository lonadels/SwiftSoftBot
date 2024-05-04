declare global {
    interface Array<T> {
        /**
         * Возвращает последний элемент массива или устанавливает его
         */
        get last(): T | undefined;

        set last(value: T);

        /**
         * Возвращает первый элемент массива или устанавливает его
         */
        get first(): T | undefined;

        set first(value: T);
    }
}

Object.defineProperties(Array.prototype, {
    last: {
        get: function <T>(this: T[]) {
            return this.length > 0 ? this[this.length - 1] : undefined;
        },
        set: function <T>(this: T[], value: T) {
            if (this.length > 0) {
                this[this.length - 1] = value;
            } else if (value !== undefined) {
                this.push(value);
            }
        },
    },
    first: {
        get: function <T>(this: T[]) {
            return this[0];
        },
        set: function <T>(this: T[], value: T) {
            if (this.length > 0) {
                this[0] = value;
            } else if (value !== undefined) {
                this.push(value);
            }
        },
    },
});
