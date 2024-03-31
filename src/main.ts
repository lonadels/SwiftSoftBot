import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config(); // ALWAYS BE FIRST!

import "reflect-metadata";

import { ParseModeFlavor } from "@grammyjs/parse-mode";
import { Context, InputFile, InlineKeyboard } from "grammy";
import { MenuFlavor } from "@grammyjs/menu";

import { HydrateFlavor } from "@grammyjs/hydrate";

export type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

import DataSource from "./database/DataSource";

import { initBot } from "./initBot";

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
}

main();
