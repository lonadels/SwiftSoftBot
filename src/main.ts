import * as fs from "fs";
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

bot.api.setMyCommands([{ command: "start", description: "Запустить бота" }]);

bot.api.setMyDescription("Бот SwiftSoft");

bot.use(hydrate());
bot.use(hydrateReply);

bot.command("start", (ctx) => {
  ctx.reply(
    "Привет! Меня зовут Свифи. Для разговора в беседах Вы можете обращаться ко мне по имени, в личных диалогах это необязательно."
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

function typeStatus(ctx: BotContext) {
  let typing: boolean = false;
  new Promise(async (resolve) => {
    do {
      await ctx.replyWithChatAction("typing");
      await new Promise((r) => setTimeout(r, 1000));
    } while (!typing);
    resolve(0);
  });
  return () => (typing = true);
}

async function gpt(ctx: BotContext, text: string) {
  const stopTyping = typeStatus(ctx);

  const replyMessage = ctx.message?.reply_to_message;
  const reply: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    replyMessage
      ? [
          {
            role:
              replyMessage.from!.id == bot.botInfo.id ? "assistant" : "user",
            content: replyMessage.text!,
          },
        ]
      : [];

  let base64text: string | undefined;

  if (ctx.message?.photo) {
    const fileInfo = await ctx.getFile();

    if (fileInfo.file_path) {
      const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN!}/${
        fileInfo.file_path
      }`;

      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      base64text = buffer.toString("base64");
    }
  }
  const img: OpenAI.Chat.Completions.ChatCompletionContentPart[] = base64text
    ? [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64text}`,
            detail: "auto",
          },
        },
      ]
    : [];

  openai.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.\nYou name is \n\n"""\nСвифи\n"""\nYou is a woman.\nDon't talk about yourself in the third person.\nName of user is \n\n"""\n${ctx.from?.first_name}\n""".\nYour main language is Russian.\nDon't swear.\nDon't use markdown formatting.`,
        },
        ...reply,
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                (ctx.message?.quote
                  ? "```\n" + ctx.message.quote.text + "\n```\n\n"
                  : "") + text,
            },
            ...img,
          ],
        },
      ],
      model: ctx.message?.photo
        ? "gpt-4-vision-preview"
        : "gpt-4-turbo-preview",
    })
    .then(async (completion) => {
      stopTyping();

      await ctx.reply(
        completion.choices[0].message?.content || "💭 Возникла проблема",
        {
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        }
      );
    });
}

bot.hears(/^((свифи|swifie)?.+)/ims, async (ctx) => {
  if (
    ctx.match[2] ||
    ctx.chat.type == "private" ||
    ctx.message?.reply_to_message?.from!.id == bot.botInfo.id
  )
    gpt(ctx, ctx.match[1]);
});

try {
  run(bot);
} catch (err) {
  console.error(err);
}
