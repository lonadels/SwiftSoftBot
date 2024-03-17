import * as dotenv from "dotenv";
dotenv.config(); // ALWAYS BE FIRST!

import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import { Context, Bot, BotError, GrammyError, HttpError } from "grammy";
import { Menu, MenuFlavor } from "@grammyjs/menu";

import FixMarkdown from "./fix";
import { escapers } from "@telegraf/entity";

export type BotContext = ParseModeFlavor<Context> & MenuFlavor;

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.api.config.use(autoRetry());

bot.api.setMyCommands([
  { command: "start", description: "Запустить бота" },
  { command: "ass", description: "Интерфейс жопы" },
  { command: "md", description: "Форматирование" },
]);

bot.api.setMyDescription("Бот SwiftSoft");

bot.use(hydrateReply);

let assOpen: boolean = false;

const assStatus = () => `Жопа ${assOpen ? "🟢 открыта" : "🔴 закрыта"}`;

const initAss = (ctx: BotContext) => {
  ctx.reply(assStatus(), { reply_markup: menu, parse_mode: "MarkdownV2" });
};
const menu = new Menu("mainMenu", {
  autoAnswer: false,
  onMenuOutdated: async (ctx) => {
    await ctx.answerCallbackQuery({
      text: assStatus(),
    });
    await ctx.editMessageText(assStatus(), {
      reply_markup: menu,
      parse_mode: "MarkdownV2",
    });
    return true;
  },
}).text(
  () => (assOpen ? "Закрыть жопу" : "Открыть жопу"),
  async (ctx) => {
    assOpen = !assOpen;

    await ctx.answerCallbackQuery({
      text: assStatus(),
    });

    try {
      await ctx.editMessageText(assStatus(), { parse_mode: "MarkdownV2" });
    } catch (_) {}
  }
);

bot.use(menu);

bot.command("start", (ctx) => {
  ctx.reply(
    "*Почему чешется жопа?*\nОбычно потому что глисты\n```\nпиздец ты даун```",
    {
      parse_mode: "MarkdownV2",
    }
  );
});

bot.command("ass", initAss);

bot.hears(/(md|markdown|marked|mark) *(.+)?/ms, async (ctx) => {
  const match = ctx.match[2];
  try {
    await ctx.reply(
      match
        ? FixMarkdown(match)
            .replace(/^#+(.+)$/gm, "*$1*")
            .replace(/-/g, "\\-")
            .replace(/\./g, "\\.")
            .replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)")
        : `*Использование:* /${ctx.match[1]} _текст_`,
      {
        parse_mode: "MarkdownV2",
      }
    );
  } catch (e) {
    if (e instanceof GrammyError)
      ctx.replyWithMarkdownV2(
        `🚫 *Ошибка: *\n\`\`\`${escapers.MarkdownV2(e.description)}\`\`\``
      );
  }
});

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
