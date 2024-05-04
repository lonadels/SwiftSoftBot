export function getRandomInt(min: number, max: number) {
    return (Math.random() * (max.floor() - min.ceil()) + min.ceil()).floor(); // The maximum is exclusive and the minimum is inclusive
}
