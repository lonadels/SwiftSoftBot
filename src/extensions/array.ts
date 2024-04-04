declare global {
  interface Array<T> {
    /**
     * Returns last element of array
     */
    last(): T | undefined;
  }
}
Array.prototype.last = function <T>() {
  return this.length > 0 ? this[this.length - 1] : undefined;
};
