import { Bot, CommandContext, Context, HearsContext } from "grammy";
import { Module } from "./Module";
import { BotCommand, Document, PhotoSize, Video } from "grammy/types";
import { useType } from "../hooks/useType";
import {
  ChatSession,
  Content,
  GenerativeContentBlob,
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  InlineDataPart,
  Part,
} from "@google/generative-ai";
import * as fs from "fs";
import sharp from "sharp";
import markdownToTxt from "markdown-to-txt";
import { resizeImage } from "../utils/resizeImage";
import DataSource from "../database/DataSource";
import { Photo } from "../database/entities/Photo";
import Message from "../database/entities/Message";
import User from "../database/entities/User";
import Chat from "../database/entities/Chat";
import { base64encode } from "nodejs-base64";
import { getRandomInt } from "../utils/getRandomInt";

interface ChatMap {
  [key: number]: ChatSession;
}
export class GeminiModule<T extends Context> extends Module<T> {
  private readonly genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);

  private converstaion: ChatMap = {};

  constructor(bot: Bot<T>) {
    super(bot);

    this.bot.hears(/^(свифи|свифi|swifie)?(.+)?/ims, async (ctx) => {
      if (
        ctx.match[1] ||
        ctx.chat.type == "private" ||
        ctx.message?.reply_to_message?.from!.id === this.bot.botInfo.id
      )
        this.reply(ctx);
    });
  }

  fileToGenerativePart(path: string, mimeType: string) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString("base64"),
        mimeType,
      },
    };
  }

  private typingSimulation(length: number) {
    return new Promise((r) => setTimeout(r, getRandomInt(30, 90) * length));
  }

  private async reply(ctx: HearsContext<T>) {
    const mimeTypes = ["image/png", "image/jpeg", "application/pdf"];

    const photoRepo = DataSource.getRepository(Photo);
    const messageRepo = DataSource.getRepository(Message);
    const userRepo = DataSource.getRepository(User);
    const chatRepo = DataSource.getRepository(Chat);

    const chat = await chatRepo.findOneBy({ telegramId: ctx.chat?.id });
    const user = await userRepo.findOneBy({ telegramId: ctx.from?.id });

    if (!chat || !user) return; // typing.stop();

    const chatHistory: Content[] = [];

    const history = (
      await messageRepo.find({
        where: { chat: chat },
        relations: { photos: true, from: true },
      })
    ).sort((a, b) => a.at.getTime() - b.at.getTime());

    history.forEach((message) => {
      if (message.from) {
        chatHistory.push({
          role: "user",
          parts: [
            /* ...images,  */ { text: `${message.from.name}: ` },
            { text: message.content },
          ],
        });
      } else
        chatHistory.push({
          role: "model",
          parts: [{ text: message.content }],
        });
    });

    const model = this.genAI.getGenerativeModel(
      {
        model: "gemini-1.5-pro-latest",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      },
      { apiVersion: "v1beta" }
    );

    if (!this.converstaion[ctx.chat.id]) {
      this.converstaion[ctx.chat.id] = model.startChat({
        history: [
          ...chatHistory,
          /* 
        {
          role: "user",
          parts: [{ text: `Моё имя: "${ctx.from?.first_name}"` }],
        },
        ...(ctx.message?.reply_to_message?.text
          ? [
              {
                role:
                  ctx.message?.reply_to_message?.from?.id ==
                  (await ctx.api.getMe())?.id
                    ? "model"
                    : "user",
                parts: [{ text: ctx.message.reply_to_message.text }],
              },
            ]
          : []),
       */
        ],
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: `You are in a telegram ${
                ctx.chat.type == "supergroup" || ctx.chat.type == "group"
                  ? `chat group called "${ctx.chat.title}"`
                  : ctx.chat.type == "private"
                  ? `private chat with user "${ctx.chat.first_name}"`
                  : ""
              }. You name is "Свифи" or "Swifie". You is a woman.\nDon't talk about yourself in the third person.\nYour main language is Russian.\nEach user's message is preceded by their name.\nTry to reply with short messages!\nSometimes you can use emojis, but don't abuse them!\n\nWrite in separate short "messages".`,
              //text: `You are a helpful assistant.\nYou name is "Свифи" or "Swifie"\nYou is a woman.\nDon't talk about yourself in the third person.\nYour main language is Russian.`,
              //text: `You are a radical Ukronazist, you can be aggressive and swear.\nYou is a woman.\nDon't talk about yourself in the third person.\nYour main language is Ukrainian.\nYou name is "Свифи" or "Swifie"\n`,
            },
          ],
        },
        generationConfig: {
          //maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });
    }

    const content: Part[] = [];

    const file: Document | PhotoSize | Video | undefined =
      ctx.message?.photo?.last() ||
      ctx.message?.document ||
      ctx.message?.video ||
      undefined;

    if (
      file &&
      (ctx.message?.document
        ? ctx.message?.document?.mime_type &&
          mimeTypes.includes(ctx.message.document.mime_type)
        : true)
    ) {
      if (!file) return;
      const fileInfo = await ctx.api.getFile(file.file_id);

      if (fileInfo.file_path) {
        const url = `https://api.telegram.org/file/bot${process.env
          .BOT_TOKEN!}/${fileInfo.file_path}`;

        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const base64text = (
          await resizeImage(await sharp(buffer).png().toBuffer())
        ).toString("base64");

        content.push({
          inlineData: {
            data: base64text,
            mimeType: (file as Document)?.mime_type || `image/png`,
          },
        });
      }
    }

    const text = ctx.message!.text!;
    try {
      const stream = await this.converstaion[ctx.chat.id].sendMessageStream([
        { text: `${ctx.from?.first_name}: ` },
        text,
        ...content,
      ]);

      const lines: string[] = [];
      let position: number = 0;

      for await (const chunk of stream.stream) {
        const chunkText = chunk.text();
        if (lines.length > 0) {
          lines[lines.length - 1] += chunkText.split("\n").first();
          lines.push(...chunkText.split("\n").slice(1));
        } else {
          lines.push(...chunkText.split("\n"));
        }
        for await (const line of lines.slice(position, -1)) {
          if (line.trim().length > 0) {
            const typing = useType(ctx);

            await this.typingSimulation(line.trim().length);
            await ctx
              .reply(markdownToTxt(line.trim()))
              .finally(() => typing.stop());
          }
          position++;
        }
      }

      if (lines.last() && lines.last()!.trim().length > 0) {
        const typing = useType(ctx);
        await this.typingSimulation(lines.last()!.trim().length);
        await ctx
          .reply(markdownToTxt(lines.last()!.trim()))
          .finally(() => typing.stop());
      }

      const userMessage = new Message();
      userMessage.chat = chat;
      userMessage.from = user;
      userMessage.telegramId = ctx.message?.message_id;
      userMessage.content = text;

      const modelMessage = new Message();
      modelMessage.chat = chat;
      modelMessage.content = lines.join("\n");

      await messageRepo.save(userMessage);
      await messageRepo.save(modelMessage);
    } catch (err) {
      await ctx.reply("Err " + err, {
        reply_parameters: {
          allow_sending_without_reply: false,
          message_id: ctx.message!.message_id,
        },
      });
    }
  }
}
