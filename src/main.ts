import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config(); // ALWAYS BE FIRST!

import "reflect-metadata";

import { autoRetry } from "@grammyjs/auto-retry";
import { ParseModeFlavor, hydrateReply } from "@grammyjs/parse-mode";
import { Context, Bot, InputFile, InlineKeyboard } from "grammy";
import { Menu, MenuFlavor } from "@grammyjs/menu";

import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";

export type BotContext = ParseModeFlavor<HydrateFlavor<Context>> & MenuFlavor;

import OpenAI from "openai";
import sharp from "sharp";
import path from "path";
import { useType } from "./hooks/useType";
import { jokeAnswer } from "./utils/jokeAnswer";
import DataSource from "./database/DataSource";
import User from "./database/entities/User";

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

bot.use(async (ctx, next) => {
  const userRepo = DataSource.getRepository(User);

  userRepo.findOneByOrFail({ telegramId: ctx.from?.id }).catch(() => {
    const user = new User();
    user.telegramId = ctx.from?.id;
    userRepo.save(user);
  });

  next();
});

bot.on("msg:forward_origin", () => false);

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
  const typing = useType(ctx);

  const reply: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (ctx.message?.reply_to_message?.text)
    reply.push({
      role:
        ctx.message?.reply_to_message.from!.id == bot.botInfo.id
          ? "assistant"
          : "user",
      content: ctx.message?.reply_to_message.text,
    });

  const images: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  if (ctx.message?.photo) {
    for (const photo of ctx.message?.photo) {
      const fileInfo = await ctx.api.getFile(photo.file_id);

      if (fileInfo.file_path) {
        const url = `https://api.telegram.org/file/bot${process.env
          .BOT_TOKEN!}/${fileInfo.file_path}`;

        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const base64text = buffer.toString("base64");

        images.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64text}`,
            detail: "auto",
          },
        });
      }
    }
  }

  if (ctx.message?.reply_to_message?.photo) {
    for (const photo of ctx.message.reply_to_message.photo) {
      const fileInfo = await ctx.api.getFile(photo.file_id);

      if (fileInfo.file_path) {
        const url = `https://api.telegram.org/file/bot${process.env
          .BOT_TOKEN!}/${fileInfo.file_path}`;

        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const base64text = buffer.toString("base64");

        images.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64text}`,
            detail: "auto",
          },
        });
      }
    }
  }

  openai.chat.completions
    .create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.\nYou name is \n\n"""\nСвифи\n"""\nYou is a woman.\nDon't talk about yourself in the third person.\nName of user is \n\n"""\n${ctx.from?.first_name}\n""".\nYour main language is Russian.\nDon't use markdown formatting.`,
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
            ...images,
          ],
        },
      ],
      model: ctx.message?.photo ? "gpt-4-vision-preview" : "gpt-4-0125-preview",
    })
    .finally(() => typing.stop())
    .then(async (completion) => {
      await ctx.reply(
        completion.choices[0].message?.content || "Ничего не получилось :(",
        {
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        }
      );
    })
    .catch(async (e) => {
      await ctx.reply("⚠️ Возникла проблема\n\n```" + e.toString() + "```", {
        parse_mode: "MarkdownV2",
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

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on("msg:successful_payment", async (ctx) => {
  const userRepo = DataSource.getRepository(User);

  const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

  if (!user) return;

  const date = new Date();
  date.setDate(date.getDate() + 1);

  user.subscribe.expires = date;
  user.subscribe.starts = new Date();

  await userRepo.save(user);

  await ctx.reply(`Вы успешно активировали подписку на 30 дней!`);
});

const subscribeMenu = new Menu("subscribe").text(
  "Оформить подписку",
  async (ctx) => {
    await ctx.replyWithInvoice(
      "Подписка",
      "Доступ к расширенным генерациям на 30 дней",
      "subscription",
      process.env.PAY_TOKEN!,
      "RUB",
      [{ label: "Total", amount: 199 * 100 }]
    );
  }
);
bot.use(subscribeMenu);

bot.command(["image", "generate", "img", "gen", "dalle"], async (ctx) => {
  const userRepo = DataSource.getRepository(User);

  const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

  if (!user) return;

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

  if (
    (!user.subscribe?.expires || user.subscribe!.expires < new Date()) &&
    user.generations > 5
  ) {
    await ctx.reply(
      "<b>Ох! Кажется Ваш лимит исчерпан :(</b>\nПолучите доступ к расширенным генерациям с подпиской за 199 ₽/мес.",
      {
        parse_mode: "HTML",
        reply_markup: subscribeMenu,
      }
    );
    return;
  }

  const typing = useType(ctx);

  if (ctx.message?.photo || replyMessage?.photo) {
    if (!ctx.message?.photo && !replyMessage?.photo) return typing.stop();

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
        .finally(() => typing.stop())
        .then(async (response) => {
          if (response.data[0].url) {
            await ctx.replyWithPhoto(response.data[0].url, {
              reply_parameters: {
                allow_sending_without_reply: false,
                message_id: ctx.message!.message_id,
              },
            });
            user.generations++;
            await userRepo.save(user);
          } else
            await ctx.reply("Извините, но ничего не вышло :(", {
              reply_parameters: {
                allow_sending_without_reply: false,
                message_id: ctx.message!.message_id,
              },
            });
        })
        .catch(async (e) => {
          await ctx.reply(
            "⚠️ Возникла проблема\n\n```" + e.toString() + "```",
            {
              parse_mode: "MarkdownV2",
              reply_parameters: {
                allow_sending_without_reply: false,
                message_id: ctx.message!.message_id,
              },
            }
          );
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
      .finally(() => typing.stop())
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
      .catch(async (e) => {
        await ctx.reply("⚠️ Возникла проблема\n\n```" + e.toString() + "```", {
          parse_mode: "MarkdownV2",
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        });
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

  const typing = useType(ctx);

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
    // .finally(async () => typing.stop() )
    .then(async (response) => {
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.promises.writeFile(path, buffer);

      typing.stop();

      await ctx.replyWithVoice(new InputFile(path), {
        reply_parameters: {
          allow_sending_without_reply: false,
          message_id: ctx.message!.message_id,
        },
      });
    })
    .catch(async (e) => {
      await ctx.reply("⚠️ Возникла проблема\n\n```" + e.toString() + "```", {
        parse_mode: "MarkdownV2",
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

console.log("Initializing database...");
DataSource.initialize().then(async () => {
  console.log("Initializing bot...");
  try {
    bot.start();
  } catch (e) {
    console.error(e);
  }
});
