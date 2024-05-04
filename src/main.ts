import * as dotenv from "dotenv";
import "reflect-metadata";
import DataSource from "./database/DataSource";

import {initBot} from "./initBot";

import "./extensions/array";
import "./extensions/string";
import "./extensions/sleep";
import "./extensions/number"

async function main() {
    console.log("Initializing database...");
    DataSource.initialize().then(async () => {
        console.log("Initializing bot...");
        try {
            await initBot();
        } catch (e) {
            console.error(e);
        }
    });
}

main().then(_ => {
});
