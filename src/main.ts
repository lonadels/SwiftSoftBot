import * as dotenv from "dotenv";
dotenv.config(); // ALWAYS BE FIRST!

import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import { Context, Bot } from "grammy";
import { Menu } from "@grammyjs/menu";

export type BotContext = ParseModeFlavor<Context>;

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.api.config.use(autoRetry());

bot.api.setMyCommands([{ command: "start", description: "Запустить бота" }]);

bot.api.setMyDescription("Бот SwiftSoft");

bot.use(hydrateReply);

let assOpen: boolean = false;

const assStatus = () =>
  `*Статус жопы:* Жопа ${assOpen ? "открыта" : "закрыта"}`;

const menu = new Menu("mainMenu").text(
  () => (assOpen ? "Открыть жопу" : "Закрыть жопу"),
  (ctx) => {
    assOpen = !assOpen;
    ctx.editMessageText(assStatus(), { parse_mode: "MarkdownV2" });
    ctx.menu.update();
  }
);

bot.use(menu);

bot.command("start", (ctx) => {
  ctx.reply("*Почему чешется жопа?*\nОбычно потому что глисты\\.", {
    parse_mode: "MarkdownV2",
  });
  ctx.reply("```Пиздец ты даун```", { parse_mode: "MarkdownV2" });
});

bot.command("ass", (ctx) => {
  ctx.reply(assStatus(), { reply_markup: menu, parse_mode: "MarkdownV2" });
});

bot.start();
