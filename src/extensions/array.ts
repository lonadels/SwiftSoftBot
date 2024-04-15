declare global {
  interface Array<T> {
    /**
     * Returns last element of array
     */
    last(): T | undefined;

    /**
     * Returns first element of array
     */
    first(): T;
  }
}
Array.prototype.last = function <T>() {
  return this.length > 0 ? this[this.length - 1] : undefined;
};

Array.prototype.first = function <T>() {
  return this[0];
};
