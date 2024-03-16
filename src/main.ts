import * as dotenv from "dotenv";
dotenv.config(); // ALWAYS BE FIRST!

import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import { Context, Bot, BotError, GrammyError, HttpError } from "grammy";
import { Menu } from "@grammyjs/menu";

import FixMarkdown from "./fix";

export type BotContext = ParseModeFlavor<Context>;

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.api.config.use(autoRetry());

bot.api.setMyCommands([{ command: "start", description: "Запустить бота" }]);

bot.api.setMyDescription("Бот SwiftSoft");

bot.use(hydrateReply);

let assOpen: boolean = false;

const assStatus = () =>
  `*Статус жопы:* Жопа ${assOpen ? "открыта" : "закрыта"}`;

const menu = new Menu("mainMenu", { autoAnswer: false }).text(
  () => (assOpen ? "Закрыть жопу" : "Открыть жопу"),
  async (ctx) => {
    assOpen = !assOpen;

    await ctx.answerCallbackQuery({
      text: `Жопа ${assOpen ? "открыта" : "закрыта"}`,
    });

    await ctx.editMessageText(assStatus(), { parse_mode: "MarkdownV2" });
    // ctx.menu.update();
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

// Matches the message text against a string or a regular expression.
bot.hears(/(md|markdown|marked|mark) *(.+)?/ms, async (ctx) => {
  const match = ctx.match[2];
  ctx.reply(
    match
      ? FixMarkdown(match)
          .replace(/^#+(.+)$/gm, "*$1*")
          .replace(/-/g, "\\-")
          .replace(/\./g, "\\.")
          .replace(/\(/g, "\\(")
          .replace(/\)/g, "\\)")
      : `*Использование:* ${ctx.match[1]} _текст_/`,
    {
      parse_mode: "MarkdownV2",
    }
  );
});

bot.command("md", async (ctx) => {});

function errorHandler(err: BotError<BotContext>) {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
}

bot.catch(errorHandler);

bot.start();
