import * as dotenv from "dotenv";
dotenv.config(); // ALWAYS BE FIRST!

import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import { Context, Bot } from "grammy";

export type BotContext = ParseModeFlavor<Context>;

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.api.config.use(autoRetry());

bot.api.setMyCommands([{ command: "start", description: "Запустить бота" }]);

bot.api.setMyDescription("Бот SwiftSoft");

bot.use(hydrateReply);

bot.command("start", (ctx) => {
  ctx.reply("*Почему чешется жопа?*\nОбычно потому что глисты\\.", {
    parse_mode: "MarkdownV2",
  });
  ctx.reply("```Пиздец ты даун```", { parse_mode: "MarkdownV2" });
});

bot.start();
