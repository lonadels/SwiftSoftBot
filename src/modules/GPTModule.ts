import { Bot, BotError, CommandContext, Context, InputFile } from "grammy";
import { Module } from "./Module";
import OpenAI from "openai";
import { useType } from "../hooks/useType";
import checkHasArgs from "../utils/checkHasArgs";
import * as fs from "fs";
import DataSource from "../database/DataSource";
import User from "../database/entities/User";
import { convertImageFormat } from "../utils/convertImageFormat";
import { createReadStreamFromBuffer } from "../utils/createReadStreamFromBuffer";
import { SubscriptionModule } from "./SubscriptionModule";
import { BotCommand } from "grammy/types";
import { Menu } from "@grammyjs/menu";
import { Voices } from "../database/Voices";

export class GPTModule<T extends Context = Context> extends Module<T> {
  private readonly openai: OpenAI;
  private readonly subscriptionModule?: SubscriptionModule<T>;

  public readonly commands: BotCommand[] = [
    { command: "tts", description: "Озвучить текст" },
    { command: "img", description: "Сгенерировать изображение" },
    { command: "tts_voice", description: "Выбрать голос" },
  ];

  private voiceMenu!: Menu;

  constructor(
    bot: Bot<T>,
    options?: { subscriptionModule?: SubscriptionModule<T> }
  ) {
    super(bot);

    this.openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

    if (options?.subscriptionModule)
      this.subscriptionModule = options.subscriptionModule;

    this.voiceMenu = new Menu("voice", { autoAnswer: false }).dynamic(
      async (ctx, range) => {
        const userRepo = DataSource.getRepository(User);
        const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

        if (!user) return;

        const voices: Voices[] = [
          "alloy",
          "echo",
          "fable",
          "nova",
          "onyx",
          "shimmer",
        ];

        voices.forEach((voice, i) => {
          range.text(
            `${user.voice == voice ? "✅ " : ""}${voice}`,
            async (ctx) => {
              user.voice = voice;
              userRepo.save(user);

              ctx.answerCallbackQuery({ text: `Голос "${voice}" установлен` });
              ctx.menu.update();
            }
          );
          if ((i + 1) % 3 === 0) range.row();
        });
      }
    );
    this.bot.use(this.voiceMenu);

    this.bot.command(["image", "generate", "img", "gen", "dalle"], (ctx) =>
      this.image(ctx)
    );
    this.bot.command("tts_voice", (ctx) => this.setVoice(ctx));
    this.bot.command(["speak", "voice", "tts"], (ctx) => this.voice(ctx));

    this.bot.hears(/^((свифи|swifie)?.+)/ims, async (ctx) => {
      if (
        ctx.match[2] ||
        ctx.chat.type == "private" ||
        ctx.message?.reply_to_message?.from!.id === this.bot.botInfo.id
      )
        this.reply(ctx, ctx.match[1]);
    });
  }

  initModule(): void {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onError(ctx: Context): (e: any) => Promise<void> {
    return async (e) => {
      await ctx.reply("⚠️ Возникла проблема\n\n```" + e.toString() + "```", {
        parse_mode: "MarkdownV2",
        reply_parameters: {
          allow_sending_without_reply: false,
          message_id: ctx.message!.message_id,
        },
      });
    };
  }

  private async reply(ctx: T, text: string) {
    const typing = useType(ctx);

    const reply: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (ctx.message?.reply_to_message?.text)
      reply.push({
        role:
          ctx.message?.reply_to_message.from!.id == this.bot.botInfo.id
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

          // TODO: load all images
          images.splice(0);
          images.push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64text}`,
              detail: "high",
            },
          });
        }
      }
    }

    if (ctx.message?.reply_to_message?.photo) {
      for (const photo of ctx.message.reply_to_message?.photo) {
        const fileInfo = await ctx.api.getFile(photo.file_id);

        if (fileInfo.file_path) {
          const url = `https://api.telegram.org/file/bot${process.env
            .BOT_TOKEN!}/${fileInfo.file_path}`;

          const response = await fetch(url);
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64text = buffer.toString("base64");

          // TODO: load all images
          images.splice(0);
          images.push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64text}`,
              detail: "high",
            },
          });
        }
      }
    }

    this.openai.chat.completions
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
        model: ctx.message?.photo
          ? "gpt-4-vision-preview"
          : "gpt-4-0125-preview",
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

  private async setVoice(ctx: Context) {
    await ctx.reply("<b>🎤 Выберите голос:</b>", {
      parse_mode: "HTML",
      reply_markup: this.voiceMenu,
    });
  }

  private async voice(ctx: CommandContext<T>) {
    const userRepo = DataSource.getRepository(User);
    const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

    if (!user) return;

    if (!checkHasArgs(ctx)) return;

    const typing = useType(ctx);

    if (!fs.existsSync("voices")) fs.mkdirSync("voices");

    const path = `./voices/${ctx.from?.id}_${Math.floor(
      new Date().getTime() / 1000
    ).toString()}.mp3`;

    await this.openai.audio.speech
      .create({
        model: "tts-1-hd",
        voice: user.voice,
        input: ctx.match,
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
  }

  private async image(ctx: CommandContext<T>) {
    const userRepo = DataSource.getRepository(User);

    const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

    if (!user) return;

    const prompt = ctx.match;
    const replyMessage = ctx.message?.reply_to_message;

    if (!checkHasArgs(ctx) && !replyMessage?.photo && !ctx.message?.photo)
      return;

    if (
      this?.subscriptionModule &&
      (await this.subscriptionModule.isLimitExceeded(ctx))
    )
      return;

    const typing = useType(ctx);

    if (ctx.message?.photo || replyMessage?.photo) {
      if (!ctx.message?.photo && !replyMessage?.photo) return typing.stop();

      const photo = ctx.message?.photo || replyMessage?.photo;

      const fileInfo = await ctx.api.getFile(photo![0].file_id);

      if (fileInfo.file_path) {
        const url = `https://api.telegram.org/file/bot${process.env
          .BOT_TOKEN!}/${fileInfo.file_path}`;

        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());

        await this.openai.images
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
              await ctx.replyWithDocument(response.data[0].url, {
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
          .catch(this.onError(ctx));
      }
    } else if (prompt)
      await this.openai.images
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
            await ctx.replyWithDocument(response.data[0].url, {
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
        .catch(this.onError(ctx));
  }
}
