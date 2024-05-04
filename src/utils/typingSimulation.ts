import {getRandomInt} from "./getRandomInt";

export function typingSimulation(length: number, minTime = 30, maxTime = 50) {
    return new Promise((r) =>
        setTimeout(r, getRandomInt(minTime, maxTime) * length)
    );
}
