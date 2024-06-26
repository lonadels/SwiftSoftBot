import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config(); // ALWAYS BE FIRST!

import "reflect-metadata";

import DataSource from "./database/DataSource";

import { initBot } from "./initBot";

import "./extensions/array";

function main() {
  console.log("Initializing database...");
  DataSource.initialize().then(async () => {
    console.log("Initializing bot...");
    try {
      initBot();
    } catch (e) {
      console.error(e);
    }
  });
  const arr = [1, 2];
  arr.last();
  arr.push();
}

main();
