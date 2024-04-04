import { Bot, CommandContext, Context, InputFile } from "grammy";
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
import { VoiceQuality, VoiceModel } from "../database/VoiceTypes";
import Chat from "../database/entities/Chat";
import { declOfNum, upFirst } from "../utils/strings";
import {
  ChatImageQuality,
  ImageQuality,
  ImageResolution,
  ImageStyle as ImageStyle,
} from "../database/ImageTypes";
import { Image } from "../database/entities/Image";
import { Photo } from "../database/entities/Photo";
import Message from "../database/entities/Message";

export class GPTModule<T extends Context = Context> extends Module<T> {
  private readonly openai: OpenAI;
  private readonly subscriptionModule?: SubscriptionModule<T>;

  public readonly commands: BotCommand[] = [
    { command: "voice", description: "Озвучить текст" },
    { command: "voice_settings", description: "Настройки озвучки" },
    { command: "img", description: "Сгенерировать изображение" },
    { command: "img_settings", description: "Настройки генерации изображений" },
  ];

  private imageSettingsMenu: Menu = new Menu("image_settings").dynamic(
    async (ctx, range) => {
      const chatRepo = DataSource.getRepository(Chat);
      const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

      if (!chat) return;

      range
        .submenu(
          () =>
            `Качество: ${
              { hd: "высокое", standart: "стандартное" }[chat.image.quality]
            }`,
          "image_quality"
        )
        .row()
        .submenu(() => `Размер: ${chat.image.resolution}`, "image_resolution")
        .submenu(
          () =>
            `Стиль: ${
              { natural: "обычный", vivid: "яркий" }[chat.image.style]
            }`,
          "image_style"
        );
    }
  );

  private voiceSettingsMenu: Menu = new Menu("voice_settings").dynamic(
    async (ctx, range) => {
      const chatRepo = DataSource.getRepository(Chat);
      const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

      if (!chat) return;

      range
        .submenu(() => `Голос: ${upFirst(chat.voice.name)}`, "voice_select")
        .row()
        .submenu(
          () =>
            `Качество: ${
              { default: "обычное", hd: "высокое" }[chat.voice.quality]
            }`,
          "voice_quality"
        );
    }
  );

  private imageQualityMenu: Menu = new Menu("image_quality", {
    autoAnswer: false,
  })
    .dynamic(async (ctx, range) => {
      const chatRepo = DataSource.getRepository(Chat);
      const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

      if (!chat) return;

      const titles: { [key in ImageQuality]: string } = {
        standart: "Обычное",
        hd: "Высокое",
      };

      Object.values(ImageQuality).forEach((quality) => {
        range.text(
          () => (chat.image.quality == quality ? "✅ " : "") + titles[quality],
          async (ctx) => {
            await this.setImageQualty(chat, quality);
            await ctx.answerCallbackQuery({
              text: `Качество "${titles[quality]}" установлено`,
            });

            ctx.menu.update();
          }
        );
      });
    })
    .row()
    .back("← Назад");

  private imageStyleMenu: Menu = new Menu("image_style", {
    autoAnswer: false,
  })
    .dynamic(async (ctx, range) => {
      const chatRepo = DataSource.getRepository(Chat);
      const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

      if (!chat) return;

      const titles: { [key in ImageStyle]: string } = {
        natural: "Обычный",
        vivid: "Яркий",
      };

      Object.values(ImageStyle).forEach((style) => {
        range.text(
          () => (chat.image.style == style ? "✅ " : "") + titles[style],
          async (ctx) => {
            await this.setImageStyle(chat, style);
            await ctx.answerCallbackQuery({
              text: `Стиль "${titles[style]}" установлен`,
            });

            ctx.menu.update();
          }
        );
      });
    })
    .row()
    .back("← Назад");

  private voiceQualityMenu: Menu = new Menu("voice_quality", {
    autoAnswer: false,
  })
    .dynamic(async (ctx, range) => {
      const chatRepo = DataSource.getRepository(Chat);
      const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

      if (!chat) return;

      const titles: { [key in VoiceQuality]: string } = {
        default: "Обычное",
        hd: "Высокое",
      };

      Object.values(VoiceQuality).forEach((quality) => {
        range.text(
          () => (chat.voice.quality == quality ? "✅ " : "") + titles[quality],
          async (ctx) => {
            await this.setVoiceQuality(chat, quality);
            await ctx.answerCallbackQuery({
              text: `Качество "${titles[quality]}" установлено`,
            });

            ctx.menu.update();
          }
        );
      });
    })
    .row()
    .back("← Назад");

  private async setImageQualty(chat: Chat, quality: ImageQuality) {
    const chatRepo = DataSource.getRepository(Chat);

    chat.image.quality = quality;
    await chatRepo.save(chat);
  }

  private async setImageStyle(chat: Chat, style: ImageStyle) {
    const chatRepo = DataSource.getRepository(Chat);

    chat.image.style = style;
    await chatRepo.save(chat);
  }

  private async setVoiceQuality(chat: Chat, quality: VoiceQuality) {
    const chatRepo = DataSource.getRepository(Chat);

    chat.voice.quality = quality;
    await chatRepo.save(chat);
  }

  private imageResolutionMenu: Menu = new Menu("image_resolution", {
    autoAnswer: false,
  })
    .dynamic(async (ctx, range) => {
      const chatRepo = DataSource.getRepository(Chat);
      const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

      if (!chat) return;

      const titles: { [key in ImageResolution]: string } = {
        "1792x1024": "Горизонтальный",
        "1024x1024": "Квадратный",
        "1024x1792": "Вертикальный",
      };

      Object.values(ImageResolution).forEach((resolution, i) => {
        range.text(
          () =>
            (chat.image.resolution == resolution ? "✅ " : "") +
            titles[resolution],
          async (ctx) => {
            chat.image.resolution = resolution;
            await chatRepo.save(chat);

            await ctx.answerCallbackQuery({
              text: `Размер "${titles[resolution]}" установлен`,
            });

            ctx.menu.update();
          }
        );
        if ((i + 1) % 3 === 0) range.row();
      });
    })
    .row()
    .back("← Назад");

  private voiceSelectMenu: Menu = new Menu("voice_select", {
    autoAnswer: false,
  })
    .dynamic(async (ctx, range) => {
      const chatRepo = DataSource.getRepository(Chat);
      const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

      if (!chat) return;

      Object.values(VoiceModel).forEach((voice, i) => {
        range.text(
          () => `${chat.voice.name == voice ? "✅ " : ""}${upFirst(voice)}`,
          async (ctx) => {
            chat.voice.name = voice;
            await chatRepo.save(chat);

            await ctx.answerCallbackQuery({
              text: `Голос "${upFirst(voice)}" установлен`,
            });

            ctx.menu.update();
          }
        );
        if ((i + 1) % 3 === 0) range.row();
      });
    })
    .row()
    .back("← Назад");

  constructor(
    bot: Bot<T>,
    options?: { subscriptionModule?: SubscriptionModule<T> }
  ) {
    super(bot);

    this.openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

    if (options?.subscriptionModule)
      this.subscriptionModule = options.subscriptionModule;

    this.voiceSettingsMenu.register(this.voiceSelectMenu);
    this.voiceSettingsMenu.register(this.voiceQualityMenu);

    this.bot.use(this.voiceSettingsMenu);

    this.imageSettingsMenu.register(this.imageQualityMenu);
    this.imageSettingsMenu.register(this.imageResolutionMenu);
    this.imageSettingsMenu.register(this.imageStyleMenu);

    this.bot.use(this.imageSettingsMenu);

    this.bot.command(
      ["image", "generate", "img", "gen", "dalle"],
      async (ctx) => await this.image(ctx)
    );

    this.bot.command(
      "img_settings",
      async (ctx) => await this.imageSettings(ctx)
    );

    this.bot.command(
      "voice_settings",
      async (ctx) => await this.voiceSettings(ctx)
    );

    this.bot.command(
      ["speak", "voice", "tts"],
      async (ctx) => await this.voice(ctx)
    );

    this.bot.hears(/^((свифи|swifie)?.+)/ims, async (ctx) => {
      if (
        ctx.match[2] ||
        ctx.chat.type == "private" ||
        ctx.message?.reply_to_message?.from!.id === this.bot.botInfo.id
      )
        await this.reply(ctx, ctx.match[1].replace("/", "\\/"));
    });

    //this.tune();
    //this.tuneJobs();
    //this.testModel("нарисуй мне картинку слона");
  }

  async testModel(prompt: string) {
    const completion = await this.openai.completions.create({
      prompt,
      model: "ft:davinci-002:personal::99weSthe",
    });
    console.log(`< ${prompt}`);
    console.log(`> ${completion.choices[0].text}`);
  }

  async tuneJobs() {
    const jobs = await this.openai.fineTuning.jobs.list();

    for await (const job of jobs) {
      const tune = await this.openai.fineTuning.jobs.retrieve(job.id);

      console.log(
        `[${new Date(tune.created_at * 1000).toLocaleDateString()}] ${
          tune.id
        } (${tune.status})`
      );

      if (tune.status != "succeeded") {
        const events = await this.openai.fineTuning.jobs.listEvents(tune.id);
        for await (const event of events) {
          console.log(`-- ${event.message}`);
        }
      } else {
        console.log(`# ${tune.fine_tuned_model}`);
      }
    }
  }

  async tune() {
    // Генерируем массив объектов для image_request из файла image_request.txt
    const imageRequests = this.generateDataArray(
      "models/image_request.txt",
      "image_request"
    );
    // Генерируем массив объектов для non_image_request из файла non_image_request.txt
    const nonImageRequests = this.generateDataArray(
      "models/non_image_request.txt",
      "non_image_request"
    );

    // Объединяем оба массива
    const dataArray = [...imageRequests, ...nonImageRequests];

    // Создание обучающей сессии для fine-tuning
    try {
      // Преобразуем массив объектов в строку JSONL
      const trainingData = dataArray
        .map((obj) => JSON.stringify(obj))
        .join("\n");

      fs.writeFileSync("models/tune.jsonl", trainingData);

      // Загрузка данных для fine-tuning
      const fileUpload = await this.openai.files.create({
        purpose: "fine-tune",
        file: fs.createReadStream("models/tune.jsonl"),
      });
      // Создание обучающей сессии с загруженным файлом
      const fineTune = await this.openai.fineTuning.jobs.create({
        model: "davinci-002",
        training_file: fileUpload.id,
      });
      console.log(fineTune);
    } catch (err) {
      console.error(`Ошибка создания обучающей сессии для fine-tuning: ${err}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onError(ctx: Context): (e: any) => Promise<void> {
    return async (e) => {
      await ctx.reply(
        '<b>⚠️ Возникла проблема</b>\n<pre language="error">' +
          e.toString() +
          "</pre>",
        {
          parse_mode: "HTML",
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        }
      );
    };
  }

  // Функция для чтения данных из текстового файла и преобразования в массив объектов
  generateDataArray(
    filename: string,
    completionType: string
  ): { prompt: string; completion: string }[] {
    try {
      // Читаем данные из файла и разбиваем их на строки
      const data = fs.readFileSync(filename, "utf8").trim().split("\n");
      // Создаем массив объектов на основе данных из файла
      const dataArray = data.map((prompt) => ({
        prompt,
        completion: completionType,
      }));
      return dataArray;
    } catch (err) {
      console.error(`Ошибка чтения файла: ${err}`);
      return [];
    }
  }

  private async reply(ctx: T, text: string) {
    const typing = useType(ctx);

    const photoRepo = DataSource.getRepository(Photo);
    const messageRepo = DataSource.getRepository(Message);
    const userRepo = DataSource.getRepository(User);
    const chatRepo = DataSource.getRepository(Chat);

    const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });
    const user = await userRepo.findOneBy({ telegramId: ctx.chat?.id });

    if (!chat || !user) return typing.stop();

    const history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    const messages = (await messageRepo.find({ where: { chat: chat } })).sort(
      (a, b) => a.at.getTime() - b.at.getTime()
    );

    messages.forEach((message) => {
      const images: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
      if (message.photos)
        message.photos.forEach((photo) => {
          const base64text = photo.buffer.toString("base64");
          images.push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64text}`,
              detail: "high",
            },
          });
        });
      if (message.from)
        history.push({
          role: "user",
          content: [...images, { type: "text", text: message.content }],
        });
      else
        history.push({
          role: "assistant",
          content: message.content,
        });

      console.log(message);
    });

    const images: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

    if (ctx.message?.photo) {
      for (const photo of ctx.message.photo) {
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

    let photo: Photo | undefined;

    if (ctx.message?.reply_to_message?.photo) {
      for (const messagePhoto of ctx.message.reply_to_message.photo) {
        const fileInfo = await ctx.api.getFile(messagePhoto.file_id);

        if (fileInfo.file_path) {
          const url = `https://api.telegram.org/file/bot${process.env
            .BOT_TOKEN!}/${fileInfo.file_path}`;

          const response = await fetch(url);
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64text = buffer.toString("base64");

          photo = new Photo();
          photo.buffer = buffer;

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

    const content =
      (ctx.message?.quote?.text || ctx.message?.reply_to_message?.text
        ? "<quote>\n" +
          (ctx.message?.quote?.text || ctx.message?.reply_to_message?.text) +
          "\n</quote>\n\n"
        : "") + text;

    this.openai.chat.completions
      .create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant.\nYou name is \n"""\nСвифи\n"""\nor\n"""Swifie"""\n\nYou is a woman.\nDon't talk about yourself in the third person.\nName of user is \n\n"""\n${ctx.from?.first_name}\n""".\nYour main language is Russian.\nDon't use markdown formatting.`,
          },
          ...history,
          {
            role: "user",
            content: [
              ...images,
              {
                type: "text",
                text: content,
              },
            ],
          },
        ],
        model:
          images.length > 0 ? "gpt-4-vision-preview" : "gpt-4-0125-preview",
      })
      .finally(() => typing.stop())
      .then(async (completion) => {
        const answer = completion.choices[0].message.content;

        if (!answer) return;

        const msg = await ctx.reply(answer, {
          reply_parameters: {
            allow_sending_without_reply: false,
            message_id: ctx.message!.message_id,
          },
        });

        const userMessage = new Message();
        userMessage.chat = chat;
        userMessage.from = user;
        userMessage.telegramId = ctx.message?.message_id;
        userMessage.content = content;

        if (photo) {
          userMessage.photos?.push(photo);
          await photoRepo.save(photo);
        }

        const gptMessage = new Message();
        gptMessage.chat = chat;
        gptMessage.telegramId = msg.message_id;
        gptMessage.content = answer;

        await messageRepo.save(userMessage);
        await messageRepo.save(gptMessage);
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
  private async imageSettings(ctx: Context) {
    await ctx.reply(
      "<b>🖼️ Настройки генерации изображений для этого чата</b>",
      {
        parse_mode: "HTML",
        reply_markup: this.imageSettingsMenu,
      }
    );
  }

  private async voiceSettings(ctx: Context) {
    await ctx.reply("<b>🎤 Настройки озвучки текста для этого чата</b>", {
      parse_mode: "HTML",
      reply_markup: this.voiceSettingsMenu,
    });
  }

  private async voice(ctx: CommandContext<T>) {
    const chatRepo = DataSource.getRepository(Chat);
    const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

    if (!chat) return;

    if (!checkHasArgs(ctx, ctx.message?.reply_to_message?.text != undefined))
      return;

    const typing = useType(ctx);

    if (!fs.existsSync("voices")) fs.mkdirSync("voices");

    const path = `./voices/${ctx.from?.id}_${Math.floor(
      new Date().getTime() / 1000
    ).toString()}.mp3`;

    await this.openai.audio.speech
      .create({
        model: { default: "tts-1", hd: "tts-1-hd" }[chat.voice.quality],
        voice: chat.voice.name,
        input: ctx.match || ctx.message!.reply_to_message!.text!,
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
      .catch(this.onError(ctx));
  }

  private async image(ctx: CommandContext<T>) {
    const userRepo = DataSource.getRepository(User);
    const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

    const chatRepo = DataSource.getRepository(Chat);
    const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });

    if (!user || !chat) return;

    const prompt = ctx.match;
    const replyMessage = ctx.message?.reply_to_message;

    if (
      !checkHasArgs(
        ctx,
        replyMessage?.photo != undefined || ctx.message?.photo != undefined
      )
    )
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

      const fileInfo = await ctx.api.getFile(photo!.last()!.file_id);

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
    } else if (prompt) {
      await this.openai.images
        .generate({
          model: "dall-e-3",
          // TODO: wtf?
          quality:
            chat.image.quality == ImageQuality.Standart ? "standard" : "hd",
          response_format: "url",
          prompt: prompt,
          n: 1,
          size: chat.image.resolution,
          style: chat.image.style,
        })
        .finally(() => typing.stop())
        .then(async (response) => {
          if (response.data[0].url) {
            user.generations++;
            await userRepo.save(user);

            await ctx.replyWithDocument(response.data[0].url, {
              caption:
                this?.subscriptionModule &&
                !(await this.subscriptionModule.isActive(ctx))
                  ? await this.subscriptionModule.generationsNotify(ctx)
                  : undefined,
              reply_parameters: {
                allow_sending_without_reply: false,
                message_id: ctx.message!.message_id,
              },
            });
          } else
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
}
