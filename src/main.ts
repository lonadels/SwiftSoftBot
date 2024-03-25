import * as dotenv from "dotenv";
import { run, sequentialize } from "@grammyjs/runner";

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
  NextFunction,
} from "grammy";
import { Menu, MenuFlavor } from "@grammyjs/menu";

import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";

export type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.api.config.use(autoRetry());

/* bot.use(
  sequentialize((ctx) => {
    const chat = ctx.chat?.id.toString();
    const user = ctx.from?.id.toString();
    return [chat, user].filter((con) => con !== undefined);
  })
);
 */

bot.api.setMyCommands([{ command: "start", description: "Запустить бота" }]);

bot.api.setMyDescription("Бот SwiftSoft");

bot.use(hydrate());
bot.use(hydrateReply);

bot.command("start", (ctx) => {
  ctx.reply(
    "Привет! Меня зовут Свифи. Для разговора в беседах Вы можете обращаться ко мне по имени."
  );
});

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

async function gpt(ctx: BotContext, text: string) {
  ctx.replyWithChatAction("typing");

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant.\nYou name is \n\n"""\nСвифи\n"""\nYou is a woman.\nDon't talk about yourself in the third person.\nName of user is \n\n"""\n${ctx.from?.first_name}\n"""`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    model: "gpt-3.5-turbo",
  });

  await ctx.reply(
    completion.choices[0].message?.content || "💭 Возникла проблема",
    {
      reply_parameters: {
        allow_sending_without_reply: false,
        message_id: ctx.message!.message_id,
      },
    }
  );
}

bot.hears(/^(свифи|swifie) *(.+)?/ims, async (ctx) => {
  gpt(ctx, ctx.match[2]);
});

bot.on("message:text", (ctx) => {
  const text: string = ctx.msg.text;
  if (ctx.chat.type == "private") gpt(ctx, text);
});

try {
  run(bot);
} catch (err) {
  console.error(err);
}
