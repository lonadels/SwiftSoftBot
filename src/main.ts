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
  InputFile,
} from "grammy";
import { Menu, MenuFlavor } from "@grammyjs/menu";

import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";

export type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

import OpenAI from "openai";
import { PassThrough, Readable } from "stream";
import sharp from "sharp";
import path from "path";
import { channel } from "process";
import { buffer } from "stream/consumers";
import { PhotoSize } from "grammy/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

bot.api.config.use(autoRetry());

bot.api.setMyCommands([
  { command: "start", description: "Запустить бота" },
  { command: "tts", description: "Озвучить текст" },
  { command: "img", description: "Сгенерирвать изображение" },
]);

bot.api.setMyDescription("Бот SwiftSoft");

bot.use(hydrate());
bot.use(hydrateReply);

bot.command("start", (ctx) => {
  ctx.reply(
    "Привет! Меня зовут Свифи. Для разговора в беседах Вы можете обращаться ко мне по имени, в личных диалогах это необязательно."
  );
});

bot.on(":forward_origin", () => false);

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
    replyMessage?.text
      ? [
          {
            role:
              replyMessage.from!.id == bot.botInfo.id ? "assistant" : "user",
            content: replyMessage.text,
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
                (ctx.message?.quote?.text
                  ? "```\n" + ctx.message.quote.text + "\n```\n\n"
                  : "") + text,
            },
            ...img,
          ],
        },
      ],
      model: ctx.message?.photo ? "gpt-4-vision-preview" : "gpt-4-0125-preview",
    })
    .finally(() => stopTyping())
    .then(async (completion) => {
      await ctx.reply(
        completion.choices[0].message?.content || "💭 Возникла проблема",
        {
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        }
      );
    })
    .catch(async () => {
      await ctx.reply("💭 Возникла проблема", {
        reply_parameters: {
          allow_sending_without_reply: false,
          message_id: ctx.message!.message_id,
        },
      });
    });
}

// Функция для конвертации изображения в нужный формат
async function convertImageFormat(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer).png().toBuffer();
}

// Функция для создания ReadStream из Buffer
function createReadStreamFromBuffer(
  buffer: Buffer,
  fileName: string
): fs.ReadStream {
  const tempDir = "./tmp"; // Папка для временных файлов
  const tempFilePath = path.join(tempDir, fileName); // Путь к временному файлу

  // Проверяем существование папки
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir); // Создаем папку, если она не существует
  }

  fs.writeFileSync(tempFilePath, buffer); // Записываем данные в файл
  return fs.createReadStream(tempFilePath); // Создаем ReadStream из файла
}

bot.command(["image", "generate", "img", "gen", "dalle"], async (ctx) => {
  const prompt = ctx.match;
  const replyMessage = ctx.message?.reply_to_message;

  if (!prompt && !replyMessage?.photo && !ctx.message?.photo) {
    await ctx.reply(`Usage: /img [prompt]`, {
      reply_parameters: {
        allow_sending_without_reply: false,
        message_id: ctx.message!.message_id,
      },
    });
    return;
  }

  const stopTyping = typeStatus(ctx);

  if (ctx.message?.photo || replyMessage?.photo) {
    if (!ctx.message?.photo && !replyMessage?.photo) return stopTyping();

    const photo = ctx.message?.photo || replyMessage?.photo;

    const fileInfo = await ctx.api.getFile(photo![0].file_id);

    if (fileInfo.file_path) {
      const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN!}/${
        fileInfo.file_path
      }`;

      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());

      await openai.images
        .createVariation({
          image: createReadStreamFromBuffer(
            await convertImageFormat(buffer),
            `${ctx.from?.id}_${Math.floor(
              new Date().getTime() / 1000
            ).toString()}.png`
          ),
          model: "dall-e-2",
          size: "1024x1024",
          response_format: "url",
        })
        .finally(() => stopTyping())
        .then(async (response) => {
          if (response.data[0].url)
            await ctx.replyWithPhoto(response.data[0].url, {
              reply_parameters: {
                allow_sending_without_reply: false,
                message_id: ctx.message!.message_id,
              },
            });
          else
            await ctx.reply("Извините, но ничего не вышло :(", {
              reply_parameters: {
                allow_sending_without_reply: false,
                message_id: ctx.message!.message_id,
              },
            });
        })
        .catch(async () => {
          await ctx.reply("Извините, но ничего не вышло :(", {
            reply_parameters: {
              allow_sending_without_reply: false,
              message_id: ctx.message!.message_id,
            },
          });
        });
    }
  } else if (prompt)
    await openai.images
      .generate({
        model: "dall-e-3",
        quality: "hd",
        response_format: "url",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        style: "vivid",
      })
      .finally(() => stopTyping())
      .then(async (response) => {
        if (response.data[0].url)
          await ctx.replyWithPhoto(response.data[0].url, {
            reply_parameters: {
              allow_sending_without_reply: false,
              message_id: ctx.message!.message_id,
            },
          });
        else
          await ctx.reply(
            "Извините, но ничего не вышло, Вы можете попробовать ещё раз.",
            {
              reply_parameters: {
                allow_sending_without_reply: false,
                message_id: ctx.message!.message_id,
              },
            }
          );
      })
      .catch(async () => {
        await ctx.reply(
          "Извините, но ничего не вышло, Вы можете попробовать ещё раз.",
          {
            reply_parameters: {
              allow_sending_without_reply: false,
              message_id: ctx.message!.message_id,
            },
          }
        );
      });
});

bot.command(["speak", "voice", "tts"], async (ctx) => {
  const tts = ctx.match;

  if (!tts) {
    await ctx.reply(`Usage: /tts [text to speach]`, {
      reply_parameters: {
        allow_sending_without_reply: false,
        message_id: ctx.message!.message_id,
      },
    });
    return;
  }

  const stopTyping = typeStatus(ctx);

  if (!fs.existsSync("voices")) fs.mkdirSync("voices");
  const path = `./voices/${ctx.from?.id}_${Math.floor(
    new Date().getTime() / 1000
  ).toString()}.mp3`;

  await openai.audio.speech
    .create({
      model: "tts-1",
      voice: "nova",
      input: tts,
    })
    // .finally(async () => stopTyping() )
    .then(async (response) => {
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.promises.writeFile(path, buffer);

      stopTyping();

      await ctx.replyWithVoice(new InputFile(path), {
        reply_parameters: {
          allow_sending_without_reply: false,
          message_id: ctx.message!.message_id,
        },
      });
    })
    .catch(async () => {
      await ctx.reply("Извините, но ничего не вышло :(", {
        reply_parameters: {
          allow_sending_without_reply: false,
          message_id: ctx.message!.message_id,
        },
      });
    });
});

bot.hears(/^((свифи|swifie)?.+)/ims, async (ctx) => {
  if (
    ctx.match[2] ||
    ctx.chat.type == "private" ||
    ctx.message?.reply_to_message?.from!.id === bot.botInfo.id
  )
    gpt(ctx, ctx.match[1]);
});

try {
  run(bot);
} catch (err) {
  console.error(err);
}
