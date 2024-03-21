import * as dotenv from "dotenv";
dotenv.config(); // ALWAYS BE FIRST!

import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import {
  Context,
  Bot,
  BotError,
  GrammyError,
  HttpError,
  Keyboard,
  HearsContext,
} from "grammy";
import { Menu, MenuFlavor } from "@grammyjs/menu";

import FixMarkdown from "./fix";
import { escapers } from "@telegraf/entity";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";

export type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

/* import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
  });

  console.log(completion.choices[0]);
}

main(); */

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.api.config.use(autoRetry());

bot.api.setMyCommands([
  { command: "start", description: "Запустить бота" },
  { command: "ass", description: "Интерфейс жопы" },
  { command: "md", description: "Форматирование" },
  { command: "throttle", description: "Тест задержки" },
]);

bot.api.setMyDescription("Бот SwiftSoft");

bot.use(hydrate());
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

bot.command("throttle", async (ctx) => {
  const msg = await ctx.reply("🕙 Подожди, я щас пукну...", {
    reply_parameters: {
      allow_sending_without_reply: false,
      message_id: ctx.message!.message_id,
    },
  });
  setTimeout(async () => await msg.editText("Пук!!! 💨 💨 💨 "), 2000);
});

bot.command("start", (ctx) => {
  ctx.reply(
    "*Почему чешется жопа?*\nОбычно потому что глисты\n```\nпиздец ты даун```",
    {
      parse_mode: "MarkdownV2",
    }
  );
});

bot.command("ass", initAss);

function jokeAnswer(match: string | RegExpMatchArray, answer: string = "Пиз") {
  const isUpper = match[1] === match[1].toUpperCase();
  const isLower = match[1] === match[1].toLowerCase();
  const isCamel =
    match[1][0] === match[1][0].toUpperCase() &&
    match[1][1] === match[1][1].toLowerCase();

  return `${
    isUpper ? answer.toUpperCase() : isLower ? answer.toLowerCase() : answer
  }${isCamel ? match[1].toLowerCase() : match[1]}`;
}

bot.hears(/^((да|нет)[^\s\w]*)$/i, (ctx) => {
  ctx.reply(
    jokeAnswer(ctx.match, ctx.match[2].toLowerCase() == "да" ? "Пиз" : "Ми"),
    {
      reply_parameters: {
        allow_sending_without_reply: false,
        message_id: ctx.message!.message_id,
      },
    }
  );
});

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
